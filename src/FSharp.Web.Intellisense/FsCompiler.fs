namespace BayardRock.FSharpWeb.Intellisense

open System
open System.Collections.Generic
open System.Diagnostics
open System.Linq
open System.IO
open System.Text
open System.Reflection

open Microsoft.FSharp.Compiler
open Microsoft.FSharp.Compiler.Ast
open Microsoft.FSharp.Compiler.SourceCodeServices
open Microsoft.FSharp.Compiler.SimpleSourceCodeServices

type TooltipInfo = 
    {
        LineIndex: int;
        StartIndex: int;
        EndIndex: int;
        Tooltip: string;
    }

type SimpleDeclaration =
    {
        Documentation: string;
        Glyph: int;
        Name: string;
    }

type TypeCheckResults = 
    {
        Parse : ParseFileResults
        Check : CheckFileResults
    }

/// Helper class to expose common functionality for FsCompiler methods
module FsCompilerInternals = 
    
    /// Gets the lines of source code
    let getLines(code: string) = 
        code.Split('\n')

    /// Tries to find an appropriate mscorlib references
    let findMscorlib() =

        // get the frameworks directory
        let programFilesDir = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86)
        let frameworksDir = Path.Combine(programFilesDir, "Reference Assemblies", "Microsoft", "Framework", ".NETFramework")

        // ensure that the directory exists    
        if not <| Directory.Exists(frameworksDir) then
            failwith ("Unable to find .NET framework directory: " + frameworksDir)

        let versions =
            [| "v4.5.1"; "v4.5"; "v4.0"; |]
            |> Seq.map (fun x -> Path.Combine(frameworksDir, x))
            |> Seq.filter Directory.Exists
            |> Seq.toArray

        match versions with
        | [||]  -> 
            let message = "Unable to find suitable .NET framework. Searched directories: {0}"
            let dirString = String.Join(", ", Directory.GetDirectories(frameworksDir))
            failwith (String.Format(message, dirString))
        | _     -> Path.Combine(versions.[0], "mscorlib.dll")
    
    /// Extracts all consecutive identifiers to the left of the charIndex for
    /// a specified line of code
    let extractIdentTokens line charIndex =
        
        // parse the source code
        let sourceTok = SourceTokenizer([], "/home/test.fsx")
        let tokenizer = sourceTok.CreateLineTokenizer(line)
        let rec gatherTokens (tokenizer:LineTokenizer) state =
            seq {
                match tokenizer.ScanToken(state) with
                | Some tok, state ->
                    yield tok
                    yield! gatherTokens tokenizer state
                | None, state -> ()
            }

        let tokens = gatherTokens tokenizer 0L |> Seq.toArray
        let idx = tokens |> Array.tryFindIndex(fun x -> charIndex > x.LeftColumn && charIndex <= x.LeftColumn + x.FullMatchedLength)

        match idx with
        | Some(endIndex) ->
    
            let charToken = tokens.[endIndex]
            let idx = 
                tokens.[0..endIndex]
                |> Array.rev
                |> Array.tryFindIndex (fun x -> x.TokenName <> "IDENT" && x.TokenName <> "DOT")
    
            let startIndex = 
                match idx with
                | Some(x) -> endIndex - x
                | None -> 0

            Some charToken, tokens.[startIndex..endIndex]
            |> Array.filter (fun x -> x.TokenName = "IDENT")

        | None -> None, Array.empty

    /// Parses the line of F# code and builds a list of identifier names in order
    /// to be passed into the `GetDeclarations`, `GetMethods`, or other functions
    let extractNames line charIndex identOffset = 
        
        let charToken, tokens = extractIdentTokens line charIndex
        match charToken with
        | None  _           -> (0, 0, [])
        | Some(charToken)   ->

            let names = 
                tokens
                |> Array.map (fun x -> line.Substring(x.LeftColumn, x.FullMatchedLength))
                |> Array.map (fun x -> x.Trim([|'`'|]))

            let takeSize = tokens.Length - identOffset
            let finalList = 
                if charToken.TokenName = "IDENT" && Array.length(tokens) > takeSize then
                    names |> Seq.take (takeSize) |> Seq.toList
                else
                    names |> Seq.toList

            (charToken.LeftColumn, charToken.LeftColumn + charToken.FullMatchedLength, finalList)

/// The Compiler class contains methods and for compiling F# code and other tasks
type FsCompiler (executingDirectory : string) =

    let mscorlib = FsCompilerInternals.findMscorlib()
    let baseReferences = Array.empty
    let checker = InteractiveChecker.Create()
    let optionsCache = Dictionary<string, ProjectOptions>()
    let mutable buildingLibraries = false

    /// The interactive checker object being used
    member this.Checker = checker

    /// Formats a comment into a string
    member this.BuildFormatComment (xmlCommentRetriever: string * string -> string) cmt (sb: StringBuilder) =
        match cmt with
        | XmlCommentText(s) -> sb.AppendLine(s) |> ignore
        | XmlCommentSignature(file, signature) ->
            let comment = xmlCommentRetriever (file, signature)
            if (not (comment.Equals(null))) && comment.Length > 0 then sb.AppendLine(comment) |> ignore
        | XmlCommentNone -> ()

    /// Converts a ToolTipElement into a string
    member this.BuildFormatElement isSingle el (sb: StringBuilder) xmlCommentRetriever =
        
        match el with
        | ToolTipElementNone -> ()
        | ToolTipElement(it, comment) ->
            sb.AppendLine(it) |> this.BuildFormatComment xmlCommentRetriever comment
        | ToolTipElementGroup(items) ->
            let items, msg =
                if items.Length > 10 then
                    (items |> Seq.take 10 |> List.ofSeq),
                    sprintf "   (+%d other overloads)" (items.Length - 10)
                else items, null
            if isSingle && items.Length > 1 then
                sb.AppendLine("Multiple overloads") |> ignore
            for (it, comment) in items do
                sb.AppendLine(it) |> this.BuildFormatComment xmlCommentRetriever comment
            if msg <> null then sb.AppendFormat(msg) |> ignore
        | ToolTipElementCompositionError(err) ->
            sb.Append("Composition error: " + err) |> ignore
            
    /// Formats a DataTipText into a string
    member this.FormatTip (tip, xmlCommentRetriever) =
        
        let commentRetriever = defaultArg xmlCommentRetriever (fun _ -> "")
        let sb = new StringBuilder()
        match tip with
        | ToolTipText([single]) -> this.BuildFormatElement true single sb commentRetriever
        | ToolTipText(its) -> for item in its do this.BuildFormatElement false item sb commentRetriever
        sb.ToString().Trim('\n', '\r')

    /// Tries to figure out the names to pass to GetDeclarations or GetMethods.
    member this.ExtractNames (line, charIndex) = 

        FsCompilerInternals.extractNames line charIndex 1

    /// Tries to figure out the names to pass to GetToolTip
    member this.ExtractTooltipName (line : string) (charIndex : int) = 

        FsCompilerInternals.extractNames line (charIndex + 1) 0

    /// Compiles the specified source code and returns the results
    member this.TypeCheck (source : string, fileName : string) =

        // TODO: get more creative about caching options
        let getOptionsTimeFromFile (f : string) =
            DateTime.Now.Date

        let mscorlib = ""

        // build the arguments
        let arguments = 
            [|
                yield "-r:" + mscorlib
                for r in baseReferences do yield "-r:" + r
            |]

        // get the options and parse
        let options = checker.GetProjectOptionsFromScript(fileName, source, getOptionsTimeFromFile(fileName), arguments) |> Async.RunSynchronously
        let recent = checker.TryGetRecentTypeCheckResultsForFile(fileName, options, source)
        let (parse, check) = 
            if recent.IsSome then
                Debug.WriteLine("Using cached results for file: {0}", fileName)
                
                let (parse, check, _) = recent.Value
                (parse, check)
            else 
                Debug.WriteLine("Compiling file: {0}", fileName)

                let parse = checker.ParseFileInProject(fileName, source, options) |> Async.RunSynchronously
                let answer = checker.CheckFileInProject(parse, fileName, 0, source, options, IsResultObsolete(fun () -> false), null) |> Async.RunSynchronously
        
                match answer with
                | CheckFileAnswer.Succeeded(check) -> (parse, check)
                | CheckFileAnswer.Aborted -> failwithf "Parsing did not finish... (%A)" answer

        { Check = check; Parse = parse }

    /// Convenience method for getting the methods from a piece of source code
    member this.GetMethods (source, lineNumber : int, charIndex : int) = 
        
        let lines = FsCompilerInternals.getLines(source)
        let fileName = "/home/Test.fsx"
        let tcr = this.TypeCheck(source, fileName)
        let line = lines.[lineNumber - 1]
        let _, _, names = this.ExtractTooltipName line charIndex

        match names with
        | [] -> Array.empty
        | _  -> 
            // get declarations for a location
            let methods = tcr.Check.GetMethodsAlternate(lineNumber, charIndex, line, Some(names)) |> Async.RunSynchronously

            methods.Methods
            |> Seq.map (fun x -> this.FormatTip(x.Description, None))
            |> Seq.toArray

    /// Convenience method for getting the declarations from a piece of source code
    member this.GetDeclarations (source, lineNumber : int, charIndex : int) =

        let fileName = "/home/Test.fsx"
        let tcr = this.TypeCheck(source, fileName)
        let lines = FsCompilerInternals.getLines(source)
        let line = lines.[lineNumber - 1]
        let _, _, names = this.ExtractNames(line, charIndex)

        // get declarations for a location
        let decls = 
            tcr.Check.GetDeclarationsAlternate(Some(tcr.Parse), lineNumber, charIndex, line, names, "")
            |> Async.RunSynchronously

        let items = 
            decls.Items
            |> Seq.map (fun x -> { Documentation = this.FormatTip(x.DescriptionText, None); Glyph = x.Glyph; Name = x.Name })
            |> Seq.toArray

        (names, items)

    /// Gets tooltip information for the specified information
    member this.GetToolTipText (source, lineNumber : int, charIndex : int) =

        let fileName = "/home/Test.fsx"
        let tcr = this.TypeCheck(source, fileName)
        let lines = FsCompilerInternals.getLines(source)
        let line = lines.[lineNumber - 1]
        let (startIndex, endIndex, names) = this.ExtractTooltipName line charIndex
        let identToken = Parser.tagOfToken(Parser.token.IDENT("")) 
        let toolTip = tcr.Check.GetToolTipTextAlternate(lineNumber, charIndex, line, names, identToken) |> Async.RunSynchronously

        (startIndex, endIndex, this.FormatTip(toolTip, None))