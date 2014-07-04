module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/*! <%= pkg.name %> v<%= pkg.version %> | <%= pkg.homepage %> */\n'
        },
        unwrap: {
            options: {
                base: './src',
                globalBase: './src/global_modules',
                banner: '<%= meta.banner %>'
            },
            selectbox: {
                options: {
                    name: 'selectbox',
                    namespace: 'window'
                },
                src: './src/selectbox.js',
                dest: './dist/selectbox.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= meta.banner %>'
            },
            selectbox: {
                src: './dist/selectbox.js',
                dest: './dist/selectbox-min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-unwrap');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['unwrap', 'uglify']);

};