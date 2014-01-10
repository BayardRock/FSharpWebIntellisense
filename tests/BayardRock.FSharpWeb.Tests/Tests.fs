namespace BayardRock.FSharpWeb.Tests

open FsUnit
open NUnit.Framework
open BayardRock.FSharpWeb.Intellisense

[<TestFixture>]
module ExtractNamesTest =

    [<Test>]
    let testExtractNames1 () =
        let expected = ["one"; "two"; "three"; "four";]
        let code = "one.two.three.four."
        let actual = IntellisenseHelper.ExtractNames code code.Length

        Assert.AreEqual(expected, actual)
       
    [<Test>]
    let testExtractNames2 () =
        let expected = ["x"]
        let code = "x."
        let actual = IntellisenseHelper.ExtractNames code code.Length

        Assert.AreEqual(expected, actual)
       
    [<Test>]
    let testExtractNames3 () =
        let expected = ["x"]
        let code = "    x."
        let actual = IntellisenseHelper.ExtractNames code code.Length

        Assert.AreEqual(expected, actual)
       
    [<Test>]
    let testExtractNames4 () =
        let expected = ["x"]
        let code = "\tx."
        let actual = IntellisenseHelper.ExtractNames code code.Length

        Assert.AreEqual(expected, actual)
       
    [<Test>]
    let testExtractNames5 () =
        let expected = ["one"]
        let code = "    one.two.three   "
        let actual = IntellisenseHelper.ExtractNames code 10

        Assert.AreEqual(expected, actual)

    [<Test>]
    let testExtractNames6 () =
        let expected = []
        let code = "x"
        let actual = IntellisenseHelper.ExtractNames code 1

        Assert.AreEqual(expected, actual)
              
