import { IFile, IOptions, IReplacementItem } from '../types';
const fs = require('fs');
const path = require('path');
const write = require('write');
const regIsFoldPath = new RegExp(path.sep + '$');

export class Convertor {

    options:IOptions;
    files: Record<string, IFile>;
    fileFilter:RegExp;

    constructor (options:IOptions) {
        this.options = options;
        this.fixPath();
        this.fileFilter =  /.(svg|json|js)$/i; // default
        this.files = {};
    }

    fixPath() {
        if(!regIsFoldPath.test(this.options.input)) {
            this.options.input+=path.sep;
        }
        if(!regIsFoldPath.test(this.options.output)) {
            this.options.output+=path.sep;
        }
    }

    clean() {
        fs.mkdirSync(this.options.output, {
            recursive: true,
            force: true
        });
    }

    //need override
    isEndNode(item):boolean {
        return !Array.isArray(item) && !this.isOjbect(item);
    }

    flat(json:any):Record<string,any> {
        const ret = {};
        this._flat(ret, json);
        return  ret;
    }

    convert() {
        this.files = {};
        this.getFileList().forEach((fileName)=>{
            const json = JSON.parse(fs.readFileSync(path.join(this.options.input, fileName)));
            let newJson = this.options.flat ?  this.flat(json): json;
            this.renameTokenKeys(newJson);
            const newName = this.replace(fileName, this.options.replacement?.fileName);
            this.files[newName] = {
                path: path.join(this.options.output, newName),
                content: newJson
            };
        });
        return this.files;
    }

    rename() {
        if(this.options.output) {
            if(!fs.existsSync(this.options.output)) {
                this.clean();
            }
            this.getFileList().forEach((fileName)=>{
                fs.copyFileSync(
                    path.join(this.options.input, fileName),
                    path.join(this.options.output, fileName)
                );
                fs.renameSync(
                    path.join(this.options.output, fileName),
                    path.join(this.options.output, this.replace(fileName, this.options.replacement?.fileName))
                );
            });
        }
    }

    save() {
        if(Object.keys(this.files).length===0) {
            this.convert();
        }
        Object.values(this.files).forEach((file)=>{
            write.sync(file.path, JSON.stringify(file.content,null,'\t'), { overwrite: true });
        });
    }

    protected getFileList():string[] {
        let fileNameList = [];
        if(fs.existsSync(this.options.input)) {
            fileNameList = fs.readdirSync(this.options.input);
        }
        return fileNameList.filter((name)=>{
            return this.fileFilter.test(name);
        });
    }


    protected renameTokenKeys(json:any) {
        Object.keys(json).forEach((key)=>{
            const newKey = this.replace(key, this.options.replacement?.token);
            if(newKey!==key) {
                json[newKey] = JSON.parse(JSON.stringify(json[key]));
                delete json[key];
            }
            if(!this.isEndNode(json[newKey]) && json[newKey]) {
                this.renameTokenKeys(json[newKey]);
            }
        });
    }

    protected _flat(ret:Record<string,any>, json:any) {
        Object.keys(json).forEach((key)=>{
            if(this.isEndNode(json[key])) {
                ret[key] = json[key];
            } else if(json[key]){
                this._flat(ret, json[key]);
            }
        });
    }

    protected replace(name:string, replacement: IReplacementItem):string {
        if(replacement) {
            return name.replace(replacement.pattern, replacement.words);
        }
        return name;
    }

    private isOjbect(obj:any) {
        return Object. prototype. toString. call(obj) === '[Object Object]';
    }

}