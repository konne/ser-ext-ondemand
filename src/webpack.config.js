const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const PathOverridePlugin = require("path-override-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const PKG = require("./package.json");
const packagenName = PKG.name;
const deployPath = "dist";
const WebPackDeployAfterBuild = require("webpack-deploy-after-build");

function CssLoaderReplacerPlugin(options) {
}

function checkForCssInRoot(result) {
    if(result.request.indexOf("node_modules") === -1 && 
       result.request.indexOf("css!") > -1 &&
       result.context.indexOf("node_modules") === -1) {
        return true;
    }
    return false;
}

function checkForCssInDavinci(result) {
    if(result.request.indexOf("node_modules") === -1 && 
       result.request.indexOf("css!") > -1 &&
       result.context.indexOf("node_modules\\davinci.js") > -1) {
        return true;
    }
    return false;
}

function replaceLess(result, callback) {

    if(checkForCssInRoot(result)) {

        result.request = result.request.replace("css!./", "./");
        result.request = result.request.replace(".css", ".less");
    }

    if(checkForCssInDavinci(result)) {

        result.request = result.request.replace("css!./", "./");
    }
    return callback();
}

function cbLoadNMFPlugin(nmf) {
    nmf.plugin("before-resolve", replaceLess);
}

CssLoaderReplacerPlugin.prototype.apply = function(resolver) {
    resolver.plugin("normal-module-factory", cbLoadNMFPlugin);
};

let config = {
    mode: "production",
    context: path.join(__dirname),
    optimization: {
        minimize: false
    },
    entry: `./${packagenName}.ts`,
    output: {
        filename: `${packagenName}.js`,
        path: path.resolve(__dirname, deployPath),
        libraryTarget: "umd"
    },
    module: {
        rules: [
            { test: /text!.*\.html$/, use: "raw-loader"},
            { test: /\.tsx?$/, 
                loader: "ts-loader",
                exclude: [/node_modules/],
                options: {
                    configFile: "tsconfigBuild.json"
                }
            },
            { test: /\.less$/, use: [{
                    loader: "style-loader"
                }, {
                    loader: "css-loader"
                }, {
                    loader: "less-loader"
                }]
            },
            { test: /(\.css$)/, use:  [
                {
                    loader: "style-loader",
                    options: {
                        convertToAbsoluteUrls: true
                    }
                },
                {
                    loader: "css-loader",
                    options: { 
                        modules: false,
                        importLoaders: 1
                    },
                },
                {
                    loader: "postcss-loader",
                    options: {
                        plugins: () => ([
                        require("autoprefixer"),
                        require("precss"),
                        ]),
                    },
                },
            ]},
            { test: /\.eot$/, loader: "url-loader?limit=100000&mimetype=application/vnd.ms-fontobject" },
            { test: /\.woff2$/, loader: "url-loader?limit=100000&mimetype=application/font-woff2" },
            { test: /\.woff$/, loader: "url-loader?limit=100000&mimetype=application/font-woff" },
            { test: /\.ttf$/, loader: "url-loader?limit=100000&mimetype=application/font-ttf" },
            { test: /\.svg$/, loader: "url-loader?limit=100000&mimetype=image/svg+xml"},
            { test: /\.(png|jpg|gif)$/, loader: "url-loader", options: { limit: 10000 } }
        ]
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    resolveLoader: {
        alias: {
            "text": "raw-loader",
            "css": "css-loader"
        }
    },
    externals: [
        { angular: "angular" },
        { qvangular: "qvangular" },
        { qlik: "qlik" }
    ],
    plugins: [
        new CssLoaderReplacerPlugin({options: true}),
        new CleanWebpackPlugin( (deployPath), { allowExternal: true } ),
        new CleanWebpackPlugin( ("placeholder"), { allowExternal: true } ),
        new PathOverridePlugin(/\/umd\//, "/esm/"),
        new CopyWebpackPlugin([
            { from: `${packagenName}.qext`, to: `${packagenName}.qext`},
            { from: "wbfolder.wbl", to: "wbfolder.wbl"}
        ]),
        new ZipPlugin({
            path: "./",
            filename: `${packagenName}.zip`,
        }),
        new WebPackDeployAfterBuild({
            from: path.resolve(__dirname, "./dist"),
            to: `C:/QlikShare/StaticContent/Extensions/${packagenName}/`
        })
    ]
};


config.plugins = [
    ...config.plugins,
];

/**
 * Export for npm
 */
module.exports = config;

