const { series, parallel, watch, src, dest } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const ejs = require('gulp-ejs');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const del = require('del');
const browserSync = require('browser-sync').create();
const babel = require('gulp-babel');

/**
 * ? Config
 */
const openFile = 'index.html';
const ASSETS = 'assets/';
const RESOURCES = 'resources/';
const HTML = './dist/';

const CONFIG = {
    workspace: {
        HTML: './src/',
        ASSETS: {
            FONTS: `./src/${ASSETS}fonts`,
            IMAGES: `./src/${ASSETS}images`,
            STYLE: `./src/${ASSETS}scss`,
            SCRIPT: `./src/${ASSETS}script`,
            LIBRARY: `./src/${ASSETS}library`,
        },
    },
    deploy: {
        HTML: HTML,
        ASSETS: {
            FONTS: `./dist/${RESOURCES}${ASSETS}fonts`,
            IMAGES: `./dist/${RESOURCES}${ASSETS}images`,
            STYLE: `./dist/${RESOURCES}${ASSETS}css`,
            SCRIPT: `./dist/${RESOURCES}${ASSETS}script`,
            LIBRARY: `./dist/${RESOURCES}${ASSETS}library`,
        },
    },
};

/**
 * ? @task : EJS
 */
async function EJS() {
    return new Promise((resolve, reject) => {
        src([`${CONFIG.workspace.HTML}/**/*.html`, `!${CONFIG.workspace.HTML}/**/include/*.html`, `!${CONFIG.workspace.HTML}/php/**/*.html`])
            .pipe(ejs())
            .pipe(dest(CONFIG.deploy.HTML))
            .on('end', resolve)
            .on('error', reject);
    });
}

/**
 * ? @task : Sass
 */
async function CompileCSS() {
    return new Promise((resolve, reject) => {
        src(`${CONFIG.workspace.ASSETS.STYLE}/*.scss`)
            .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
            .pipe(dest(CONFIG.deploy.ASSETS.STYLE))
            .on('end', resolve)
            .on('error', reject);
    });
}

/**
 * ? @task : Imagemin
 */
async function Imagemin() {
    return new Promise((resolve, reject) => {
        src(`${CONFIG.workspace.ASSETS.IMAGES}/**/*.*`, { encoding: false })
            .pipe(imagemin([imagemin.gifsicle({ interlaced: true }), imagemin.mozjpeg({ quality: 85, progressive: true }), imagemin.optipng({ optimizationLevel: 5 }), imagemin.svgo({ plugins: [{ removeViewBox: false }, { cleanupIDs: false }] })]))
            .on('data', (file) => {
                console.log(`Processing file: ${file.path}`);
            })
            .pipe(dest(CONFIG.deploy.ASSETS.IMAGES))
            .on('end', resolve)
            .on('error', reject);
    });
}
/**
 * ? @task : Copy - Library
 */
async function Library() {
    return new Promise((resolve, reject) => {
        src(`${CONFIG.workspace.ASSETS.LIBRARY}/**/*`).pipe(dest(CONFIG.deploy.ASSETS.LIBRARY)).on('end', resolve).on('error', reject);
    });
}

/**
 * ? @task : Copy - Javascript
 */
async function Script() {
    return new Promise((resolve, reject) => {
        src(`${CONFIG.workspace.ASSETS.SCRIPT}/**/*.js`)
            .pipe(babel({ presets: ['@babel/preset-env'] }))
            .pipe(dest(CONFIG.deploy.ASSETS.SCRIPT))
            .on('end', resolve)
            .on('error', reject);
    });
}

/**
 * ? @task : Copy - Fonts
 */
async function Font() {
    return new Promise((resolve, reject) => {
        src(`${CONFIG.workspace.ASSETS.FONTS}/**/*`, { encoding: 'binary' }).pipe(newer(CONFIG.deploy.ASSETS.FONTS)).pipe(dest(CONFIG.deploy.ASSETS.FONTS)).on('end', resolve).on('error', reject);
    });
}

/**
 * ? @task : Clean
 */
async function Clean() {
    return del('./dist');
}

/**
 * ? @task : Browser Sync
 */
async function BrowserSync() {
    browserSync.init({
        server: {
            baseDir: './dist',
            index: openFile,
        },
        port: 8080,
        cors: true,
        online: true,
    });
}

/**
 * ? @task : Lottie
 */
async function Lottie() {
    return new Promise((resolve, reject) => {
        src(`${CONFIG.workspace.ASSETS.IMAGES}/*.json`).pipe(dest(CONFIG.deploy.ASSETS.IMAGES)).on('end', resolve).on('error', reject);
    });
}

/**
 * ? @task : Watch
 */
function Watch() {
    watch(`${CONFIG.workspace.HTML}/**/*.html`, EJS).on('change', browserSync.reload);
    watch(`${CONFIG.workspace.ASSETS.STYLE}/**/*.scss`, CompileCSS).on('change', browserSync.reload);
    watch(`${CONFIG.workspace.ASSETS.IMAGES}/**/*.*`, Imagemin).on('change', browserSync.reload);
    watch(`${CONFIG.workspace.ASSETS.SCRIPT}/**/*.js`, Script).on('change', browserSync.reload);
    watch(`${CONFIG.workspace.ASSETS.IMAGES}/*.json`, Lottie).on('change', browserSync.reload);
}

/**
 * ? 기본 작업
 */
const defaultTasks = series(Clean, parallel(CompileCSS, EJS, Script, Library, Font, Imagemin, Lottie), BrowserSync, Watch);

module.exports = {
    default: defaultTasks,
    clean: Clean,
};
