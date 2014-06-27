namespace BayardRock.FSharpWeb.Tests

open FsUnit
open NUnit.Framework
open BayardRock.FSharpWeb.Intellisense

[<TestFixture>]
module ExtractNamesTest =

    let compiler = FsCompiler(".")
