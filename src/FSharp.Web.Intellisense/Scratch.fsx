#r "..\\..\\lib\\FSharp.Compiler.dll"
#r "..\\..\\lib\\FSharp.Compiler.Interactive.Settings.dll"
#r "..\\..\\lib\\FSharp.Compiler.Server.Shared.dll"

open System
open System.Text
open Microsoft.FSharp.Compiler
open Microsoft.FSharp.Compiler.Ast
open Microsoft.FSharp.Compiler.SourceCodeServices

let checker = InteractiveChecker.Create(NotifyFileTypeCheckStateIsDirty ignore)