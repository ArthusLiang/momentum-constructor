const path = require('path');
const fs = require('fs');
const { convertors } = require('../dist/index');
let packagePath = require.resolve('momentum-abstract');

let myConvertor;
let outputPath = path.resolve(__dirname,'./output/illustration');
let newIcons = [];

describe("Test illustration",()=>{

    beforeAll(() => {
        myConvertor = convertors.illustration({
            input: path.resolve(packagePath, '../illustration'),
            output: outputPath,
            replacement: {
                fileName: {
                    pattern: /\-/g,
                    words: '@'
                }
            }
        });
        myConvertor.clean();
        myConvertor.rename();
        newIcons = fs.readdirSync(outputPath);
    });

    test('Icon: illustration convert', () => {
        expect(Object.keys(newIcons).length).toBeGreaterThan(0);
    });

    test('Icon: illustration replace file name', () => {
        let hasNoConvert = newIcons.some((fileName)=>{
            return /\-/.test(fileName);
        });
        expect(hasNoConvert).toBe(false);
    });

});
