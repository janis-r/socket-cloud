import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import typescript2 from "rollup-plugin-typescript2";
import commonjs from '@rollup/plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import {terser} from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import progress from 'rollup-plugin-progress';
// import babel from "rollup-plugin-babel";

export default {
    input: './src/app/web-client/webClient.ts',
    output: [
        {
            file: './bundle/webClient.js',
            format: 'iife',
            name: 'webClient',
            sourcemap: true,
            plugins: [sourceMaps()],
            treeshake: true
        },
        {
            file: './bundle/webClient.min.js',
            format: 'iife',
            name: 'webClient',
            sourcemap: true,
            plugins: [terser()]
        }
    ],
    plugins: [
        json(),
        commonjs(),
        resolve({
            mainFields: ['jsnext', 'jsnext:main', 'module'],
            preferBuiltins: true
        }),
        // tsp({}),
        typescript2({
            tsconfig: "./tsconfig.rollup.json",
            include: ["*.ts+(|x)", "**/*.ts+(|x)", "*.js"],
            // verbosity: 3
        }),

        // babel(),
        filesize(),
        progress(),
    ]
};