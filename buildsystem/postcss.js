/*jshint esversion: 6 */
/*
 * Copyright (C) 2017  luffah<contact@luffah.xyz>
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
const fs = require('fs');
const postcss = require('postcss');
var postcss_plugins = [
    require("autoprefixer"),
    require("cssnano")
];
fs.readFile('src/css/terminus.css', (err, css) => {
    postcss(postcss_plugins)
        .process(css, { from: 'src/css/terminus.css', to: 'min.css' })
        .then(result => {
            fs.writeFile('_build/min.css', result.css);
            if ( result.map ) fs.writeFile('_build/min.css.map', result.map);
        });
});

