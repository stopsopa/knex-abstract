#!/usr/bin/env node

const path  = require('path');

const fs    = require('fs');

const createIgnoreFilter = (ignorefile, root) => {

    let ignore = fs.readFileSync(ignorefile).toString();

    ignore = ignore.split("\n");

    ignore = ignore.map(n => n.trim()).filter(n => n).filter(n => n.indexOf('#') !== 0);

    /**
     * https://www.npmjs.com/package/ignore v4.0.2
     * manually compressed
     */
    var ignoretool = function(){function e(e){return Array.isArray(e)?e:[e]}const t=/^\s+$/,r=/^\\!/,i=/^\\#/,s="/",n="undefined"!=typeof Symbol?Symbol.for("node-ignore"):"node-ignore",o=(e,t,r)=>Object.defineProperty(e,t,{value:r}),c=/([0-z])-([0-z])/g,a=[[/\\?\s+$/,e=>0===e.indexOf("\\")?" ":""],[/\\\s/g,()=>" "],[/[\\^$.|*+(){]/g,e=>`\\${e}`],[/\[([^\]/]*)($|\])/g,(e,t,r)=>"]"===r?`[${(e=>e.replace(c,(e,t,r)=>t.charCodeAt(0)<=r.charCodeAt(0)?e:""))(t)}]`:`\\${e}`],[/(?!\\)\?/g,()=>"[^/]"],[/^\//,()=>"^"],[/\//g,()=>"\\/"],[/^\^*\\\*\\\*\\\//,()=>"^(?:.*\\/)?"]],h=[[/^(?=[^^])/,function(){return/\/(?!$)/.test(this)?"^":"(?:^|\\/)"}],[/\\\/\\\*\\\*(?=\\\/|$)/g,(e,t,r)=>t+6<r.length?"(?:\\/[^\\/]+)*":"\\/.+"],[/(^|[^\\]+)\\\*(?=.+)/g,(e,t)=>`${t}[^\\/]*`],[/(\^|\\\/)?\\\*$/,(e,t)=>{return`${t?`${t}[^/]+`:"[^/]*"}(?=$|\\/$)`}],[/\\\\\\/g,()=>"\\"]],d=[...a,[/(?:[^*/])$/,e=>`${e}(?=$|\\/)`],...h],l=[...a,[/(?:[^*])$/,e=>`${e}(?=$|\\/$)`],...h],u={},_=e=>e&&"string"==typeof e&&!t.test(e)&&0!==e.indexOf("#"),f=(e,t)=>{const s=e;let n=!1;return 0===e.indexOf("!")&&(n=!0,e=e.substr(1)),{origin:s,pattern:e=e.replace(r,"!").replace(i,"#"),negative:n,regex:((e,t,r)=>{const i=u[e];if(i)return i;const s=(t?l:d).reduce((t,r)=>t.replace(r[0],r[1].bind(e)),e);return u[e]=r?new RegExp(s,"i"):new RegExp(s)})(e,n,t)}};class g{constructor({ignorecase:e=!0}={}){this._rules=[],this._ignorecase=e,o(this,n,!0),this._initCache()}_initCache(){this._cache={}}add(t){return this._added=!1,"string"==typeof t&&(t=t.split(/\r?\n/g)),e(t).forEach(this._addPattern,this),this._added&&this._initCache(),this}addPattern(e){return this.add(e)}_addPattern(e){if(e&&e[n])return this._rules=this._rules.concat(e._rules),void(this._added=!0);if(_(e)){const t=f(e,this._ignorecase);this._added=!0,this._rules.push(t)}}filter(t){return e(t).filter(e=>this._filter(e))}createFilter(){return e=>this._filter(e)}ignores(e){return!this._filter(e)}_filter(e,t){return!!e&&(e in this._cache?this._cache[e]:(t||(t=e.split(s)),t.pop(),this._cache[e]=t.length?this._filter(t.join(s)+s,t)&&this._test(e):this._test(e)))}_test(e){let t=0;return this._rules.forEach(r=>{t^r.negative||(t=r.negative^r.regex.test(e))}),!t}}if("undefined"!=typeof process&&(process.env&&process.env.IGNORE_TEST_WIN32||"win32"===process.platform)){const e=g.prototype._filter,t=e=>/^\\\\\?\\/.test(e)||/[^\x00-\x80]+/.test(e)?e:e.replace(/\\/g,"/");g.prototype._filter=function(r,i){return r=t(r),e.call(this,r,i)}}return e=>new g(e)}();

//     const ig = ignoretool().add(['*.js']);
//
// // to extract filtered list of paths
//     const filtered = ig.filter(paths)        // ['.abc/d/e.js']
//
//     console.log(filtered)
//
// // to check one path
//     const isfiltered = ig.ignores('.abc/a.js');
//
//     console.log(isfiltered ? 'true' : 'false');

    /*!
     * @version 1.0 - 2013-05-21
     * @author Szymon Działowski
     * direction : 'rl'|'r'|'l'   -->   (undefined => 'rl')
     * charlist  : (undefined => " \n")
     */
    function trim(string, charlist, direction) {
        direction = direction || 'rl';
        charlist  = (charlist || '').replace(/([.?*+^$[\]\\(){}|-])/g,'\\$1');
        charlist  = charlist || " \\n";
        (direction.indexOf('r')+1) && (string = string.replace(new RegExp('^(.*?)['+charlist+']*$','gm'),'$1'));
        (direction.indexOf('l')+1) && (string = string.replace(new RegExp('^['+charlist+']*(.*)$','gm'),'$1'));
        return string;
    }

    const ig = ignoretool().add(ignore);

    const len = (root || __dirname).length;

    return file => {

        file = file.substring(len);

        file = trim(file, '\\/', 'l');

        let test;

        if (file) {
            test = !ig.ignores(file);
        }
        else {
            test = true;
        }

        // const dump = {};
        //
        // dump[file] = test;

        // if (file) {
        //
        //     if (test) {
        //         console.log(`+ ${file} ++++++`);
        //     }
        //     else {
        //         console.log(`- ${file}`);
        //     }
        // }

        // false - ignore file
        // true - copy file
        return test;
    }
};

/**
 * https://github.com/AvianFlu/ncp
 */
function ncp (source, dest, options, callback) {
    var cback = callback;

    if (!callback) {
        cback = options;
        options = {};
    }

    var basePath = process.cwd(),
        currentPath = path.resolve(basePath, source),
        targetPath = path.resolve(basePath, dest),
        filter = options.filter,
        rename = options.rename,
        transform = options.transform,
        clobber = options.clobber !== false,
        modified = options.modified,
        dereference = options.dereference,
        errs = null,
        started = 0,
        finished = 0,
        running = 0,
        limit = options.limit || ncp.limit || 16;

    limit = (limit < 1) ? 1 : (limit > 512) ? 512 : limit;

    startCopy(currentPath);

    function startCopy(source) {
        started++;
        if (filter) {
            if (filter instanceof RegExp) {
                if (!filter.test(source)) {
                    return cb(true);
                }
            }
            else if (typeof filter === 'function') {
                if (!filter(source)) {
                    return cb(true);
                }
            }
        }
        return getStats(source);
    }

    function getStats(source) {
        var stat = dereference ? fs.stat : fs.lstat;
        if (running >= limit) {
            return setImmediate(function () {
                getStats(source);
            });
        }
        running++;
        stat(source, function (err, stats) {
            var item = {};
            if (err) {
                return onError(err);
            }

            // We need to get the mode from the stats object and preserve it.
            item.name = source;
            item.mode = stats.mode;
            item.mtime = stats.mtime; //modified time
            item.atime = stats.atime; //access time

            if (stats.isDirectory()) {
                return onDir(item);
            }
            else if (stats.isFile()) {
                return onFile(item);
            }
            else if (stats.isSymbolicLink()) {
                // Symlinks don't really need to know about the mode.
                return onLink(source);
            }
        });
    }

    function onFile(file) {
        var target = file.name.replace(currentPath, targetPath);
        if(rename) {
            target =  rename(target);
        }
        isWritable(target, function (writable) {
            if (writable) {
                return copyFile(file, target);
            }
            if(clobber) {
                rmFile(target, function () {
                    copyFile(file, target);
                });
            }
            if (modified) {
                var stat = dereference ? fs.stat : fs.lstat;
                stat(target, function(err, stats) {
                    //if souce modified time greater to target modified time copy file
                    if (file.mtime.getTime()>stats.mtime.getTime())
                        copyFile(file, target);
                    else return cb();
                });
            }
            else {
                return cb();
            }
        });
    }

    function copyFile(file, target) {
        var readStream = fs.createReadStream(file.name),
            writeStream = fs.createWriteStream(target, { mode: file.mode });

        readStream.on('error', onError);
        writeStream.on('error', onError);

        if(transform) {
            transform(readStream, writeStream, file);
        } else {
            writeStream.on('open', function() {
                readStream.pipe(writeStream);
            });
        }
        writeStream.once('finish', function() {
            if (modified) {
                //target file modified date sync.
                fs.utimesSync(target, file.atime, file.mtime);
                cb();
            }
            else cb();
        });
    }

    function rmFile(file, done) {
        fs.unlink(file, function (err) {
            if (err) {
                return onError(err);
            }
            return done();
        });
    }

    function onDir(dir) {
        var target = dir.name.replace(currentPath, targetPath);
        isWritable(target, function (writable) {
            if (writable) {
                return mkDir(dir, target);
            }
            copyDir(dir.name);
        });
    }

    function mkDir(dir, target) {
        fs.mkdir(target, dir.mode, function (err) {
            if (err) {
                return onError(err);
            }
            copyDir(dir.name);
        });
    }

    function copyDir(dir) {
        fs.readdir(dir, function (err, items) {
            if (err) {
                return onError(err);
            }
            items.forEach(function (item) {
                startCopy(path.join(dir, item));
            });
            return cb();
        });
    }

    function onLink(link) {
        var target = link.replace(currentPath, targetPath);
        fs.readlink(link, function (err, resolvedPath) {
            if (err) {
                return onError(err);
            }
            checkLink(resolvedPath, target);
        });
    }

    function checkLink(resolvedPath, target) {
        if (dereference) {
            resolvedPath = path.resolve(basePath, resolvedPath);
        }
        isWritable(target, function (writable) {
            if (writable) {
                return makeLink(resolvedPath, target);
            }
            fs.readlink(target, function (err, targetDest) {
                if (err) {
                    return onError(err);
                }
                if (dereference) {
                    targetDest = path.resolve(basePath, targetDest);
                }
                if (targetDest === resolvedPath) {
                    return cb();
                }
                return rmFile(target, function () {
                    makeLink(resolvedPath, target);
                });
            });
        });
    }

    function makeLink(linkPath, target) {
        fs.symlink(linkPath, target, function (err) {
            if (err) {
                return onError(err);
            }
            return cb();
        });
    }

    function isWritable(path, done) {
        fs.lstat(path, function (err) {
            if (err) {
                if (err.code === 'ENOENT') return done(true);
                return done(false);
            }
            return done(false);
        });
    }

    function onError(err) {
        if (options.stopOnError) {
            return cback(err);
        }
        else if (!errs && options.errs) {
            errs = fs.createWriteStream(options.errs);
        }
        else if (!errs) {
            errs = [];
        }
        if (typeof errs.write === 'undefined') {
            errs.push(err);
        }
        else {
            errs.write(err.stack + '\n\n');
        }
        return cb();
    }

    function cb(skipped) {
        if (!skipped) running--;
        finished++;
        if ((started === finished) && (running === 0)) {
            if (cback !== undefined ) {
                return errs ? cback(errs) : cback(null);
            }
        }
    }
}

const mkdirP = require(path.resolve(__dirname, '..', 'libs', 'mkdirp'));

/**
 * https://codepen.io/stopsopa/pen/RJYZgj?editors=0010
 */
const allChain = function (arrayOfFunctions, slots) {
    var output = [], count = 0;
    (slots > 0) || (slots = 1);
    return new Promise(function (resolve, reject) {
        let stop = false;
        (function next() {

            if (stop) {
                return;
            }

            if (arrayOfFunctions.length) {
                if (count < slots) {
                    count += 1;
                    arrayOfFunctions.shift()().then(function (data) {
                        output.push(data);
                        count -= 1;
                        next();
                    }, err => {
                        stop = true;
                        reject(err);
                    });

                    next();
                }
                return;
            }
            count || resolve(output);
        }());
    });
};

// console.log(JSON.stringify({
//     'process.cwd()' : process.cwd(),
//     argv: process.argv,
//     __dirname_type: typeof __dirname,
//     __dirname_json: JSON.stringify(__dirname),
//     __filename_type: typeof __filename,
//     __filename_json: JSON.stringify(__filename),
// }, null, 4));
//
// {
//     "process.cwd()": "/Users/sd/Workspace/projects/bash-make-lifecycle/install-test", # where i executed "npx bash-make-lifecycle test"
//     "argv": [
//     "/usr/local/bin/node",
//     "/Users/sd/.npm/_npx/60150/bin/bash-make-lifecycle",
//     "test"
// ],
//     "__dirname_type": "string",
//     "__dirname_json": "\"/Users/sd/.npm/_npx/60150/lib/node_modules/bash-make-lifecycle\"", # where are all files temporary installed
//     "__filename_type": "string",
//     "__filename_json": "\"/Users/sd/.npm/_npx/60150/lib/node_modules/bash-make-lifecycle/install.js\""
// }
if (process.argv[2] === '--is-linked') {

    const file  = path.resolve(__dirname, '..', 'package.json');

    const pck   = require(file);

    const st    = fs.statSync(__filename);

    process.stdout.write(pck.version + ' - ' + st.mtime);

    process.exit(0);
}

let project = ((process.argv[2] || 'knex-project') + '').trim();

if ( ! project ) {

    throw `\n\n    target is not specified, give it in first argument\n\n`;
}

project = path.resolve(process.cwd(), project);

const package = require(path.resolve(__dirname, '..', 'package.json'));

process.stdout.write(`\n    Installing ${package.name}@${package.version}\n`);

const prepareDir = target => {

    try {

        mkdirP.sync(target);
    }
    catch (e) {

        process.stdout.write(`\n    ERROR prepareDir: ${e}\n`);

        process.exit(1);
    }
};

const installTool = (source, target, filter) => new Promise((resolve, reject) => {

    ncp(source, target, {
        filter: file => {

            const copy = filter(file);

            // console.log(JSON.stringify({
            //     file,
            //     copy
            // }, null, 4))

            return copy;
        }
    }, err => {

        if (err) {

            return reject(`ncp: ${err}`);
        }

        return resolve();
    });
});

// app
(function () {

    const source = path.resolve(__dirname, '..');

    const target   = path.resolve(project);

    let list = [
        // {
        //     source: path.resolve(__dirname, '..', 'app'),
        //     target: path.resolve(project, 'app'),
        // },
        {
            source: path.join(source, 'example'),
            target: target,
        },
        {
            source: path.resolve(source, 'migrations'),
            target: path.resolve(target, 'migrations'),
        },
        // {
        //     source: path.resolve(__dirname, '..', 'public'),
        //     target: path.resolve(project, 'public'),
        // },
    ].map(l => {

        l.filter = createIgnoreFilter(
            path.resolve(l.source, '.installgnore'),
            l.source,
        );

        return l;
    });

    list.map(l => prepareDir(l.target));

    const chain = list.map(l => () => installTool(l.source, l.target, l.filter));

    allChain([
        ...chain,
        () => installTool(path.resolve(source, '.env.dist'), path.resolve(project, '.env'), () => true),
        () => installTool(path.resolve(source, 'migrations', 'ormconfig.js.dist'), path.resolve(project, 'migrations', 'ormconfig.js'), () => true),
        // () => new Promise(res => {
        //
        //     let sourceJson      = require(path.resolve(source, 'package.json'));
        //
        //     const targetFile    = path.resolve(targets, 'package.json');
        //
        //     let targetJson  = require(targetFile);
        //
        //     targetJson.dependencies.roderic = sourceJson.version;
        //     targetJson.dependencies.webpack = '^4';
        //
        //     delete targetJson.bin;
        //
        //     fs.writeFileSync(targetFile, JSON.stringify(targetJson, null, 4));
        //
        //     res();
        // })
    ])
        .then(done => {
            process.stdout.write(`
Project was initialized in directory '${project}', enjoy 🍺

Now run:

    cd "${project}"
    cd react
    yarn
    
    .. and then:
    
    DEV MODE:
        (cd react && sudo yarn dev)
        
    PROD MODE:
        (cd react && sudo yarn prod && node servers/index.js)        
        
    and optionally tests:    
        (cd puppeteer && /bin/bash test.sh)
        
    
        
    

`);

        }, err => {
            process.stdout.write('error', JSON.stringify(err, null, 4));
        })
    ;

}());


