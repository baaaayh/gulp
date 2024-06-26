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
            FONTS: './src/' + ASSETS + 'fonts',
            IMAGES: './src/' + ASSETS + 'images',
            STYLE: './src/' + ASSETS + 'scss',
            SCRIPT: './src/' + ASSETS + 'script',
            LIBRARY: './src/' + ASSETS + 'library',
        },
    },
    deploy: {
        HTML: HTML,
        ASSETS: {
            FONTS: './dist/' + RESOURCES + ASSETS + 'fonts',
            IMAGES: './dist/' + RESOURCES + ASSETS + 'images',
            STYLE: './dist/' + RESOURCES + ASSETS + 'css',
            SCRIPT: './dist/' + RESOURCES + ASSETS + 'script',
            LIBRARY: './dist/' + RESOURCES + ASSETS + 'library',
        },
    },
};

/**
 * ? @task : EJS
 */
function EJS() {
    return new Promise((resolve) => {
        src([CONFIG.workspace.HTML + '/**/*.html', '!' + CONFIG.workspace.HTML + '/**/include/*.html', '!' + CONFIG.workspace.HTML + '/php/**/*.html'])
            .pipe(ejs())
            .pipe(dest(CONFIG.deploy.HTML));
        resolve();
    });
}

/**
 * ? @task : Sass
 */
function CompileCSS() {
    return new Promise((resolve) => {
        src(CONFIG.workspace.ASSETS.STYLE + '/*.scss')
            .pipe(
                sass({
                    outputStyle: 'expanded',
                    // expanded ,compressed
                }).on('error', sass.logError)
            )
            .pipe(dest(CONFIG.deploy.ASSETS.STYLE))
            .on('end', resolve); // 이벤트가 종료될 때만 resolve() 호출
    });
}

/**
 * ? @task : Imagemin
 */
function Imagemin() {
    return new Promise((resolve) => {
        src(CONFIG.workspace.ASSETS.IMAGES + '/**/*.*')
            .pipe(newer(CONFIG.deploy.ASSETS.IMAGES))
            .pipe(
                imagemin([
                    imagemin.gifsicle({ interlaced: false }),
                    imagemin.mozjpeg({ quality: 95, progressive: false }),
                    imagemin.optipng({ optimizationLevel: 5 }),
                    // imagemin.svgo({
                    //     plugins: [{ removeViewBox: false }, { cleanupIDs: false }],
                    // }),
                ])
            )
            .pipe(dest(CONFIG.deploy.ASSETS.IMAGES));
        resolve();
    });
}

/**
 * ? @task : Copy - Library
 */
function Library() {
    return new Promise((resolve) => {
        src(CONFIG.workspace.ASSETS.LIBRARY + '/**/*').pipe(dest(CONFIG.deploy.ASSETS.LIBRARY));
        resolve();
    });
}

/**
 * ? @task : Copy - Javascript
 */
function Script() {
    return new Promise((resolve) => {
        src(CONFIG.workspace.ASSETS.SCRIPT + '/**/*')
            .pipe(
                babel({
                    presets: ['@babel/preset-env'],
                })
            )
            .pipe(dest(CONFIG.deploy.ASSETS.SCRIPT));
        resolve();
    });
}

/**
 * ? @task : Copy - Fonts
 */
function Font() {
    return new Promise((resolve) => {
        src(CONFIG.workspace.ASSETS.FONTS + '/**/*', { encoding: 'binary' })
            .pipe(newer(CONFIG.deploy.ASSETS.FONTS, { encoding: 'binary' }))
            .pipe(dest(CONFIG.deploy.ASSETS.FONTS, { encoding: 'binary' }));
        resolve();
    });
}

/**
 * ? @task : Clean
 */
function Clean() {
    return new Promise((resolve) => {
        del.sync('./dist');
        resolve();
    });
}

/**
 * ? @task : Browser Sync
 */
function BrowserSync() {
    return new Promise((resolve) => {
        browserSync.init({
            server: {
                baseDir: './dist',
                index: openFile,
            },
            port: 8080,
            cors: true,
            online: true,
        });
        resolve();
    });
}

/**
 * ? @task : Lottie
 */
function Lottie() {
    return new Promise((resolve) => {
        src(CONFIG.workspace.ASSETS.IMAGES + '/*.json').pipe(dest(CONFIG.deploy.ASSETS.IMAGES));
        resolve();
    });
}

/**
 * ? @task : Watch
 */
function Watch() {
    watch(CONFIG.workspace.HTML + '**/**/*.html', EJS).on('change', browserSync.reload);
    watch(CONFIG.workspace.HTML + '**/*.html', EJS).on('change', browserSync.reload);
    watch(CONFIG.workspace.HTML + '*.html', EJS).on('change', browserSync.reload);
    watch(CONFIG.workspace.ASSETS.STYLE + '/**/*.scss', CompileCSS).on('change', browserSync.reload);
    watch(CONFIG.workspace.ASSETS.IMAGES + '/**/**/*.*', Imagemin);
    watch(CONFIG.workspace.ASSETS.SCRIPT + '/**/*.js', Script).on('change', browserSync.reload);
    watch(CONFIG.workspace.ASSETS.IMAGES + '/*.json', Lottie).on('change', browserSync.reload);
}

const defaultTasks = [CompileCSS, EJS, Script, Library, Font, Imagemin, Lottie, BrowserSync, Watch];

module.exports = {
    default: series(defaultTasks),
    clean: series(Clean),
};
