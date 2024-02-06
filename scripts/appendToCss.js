/**
* appendToCss.js
* Copyright (c) 2019-2024 Thomas M. Brodhead <https://bmt-systems.com>
* Released under the GNU GPLv3 License
* Date: 2024-02-06
*/

window.appendToCSS = function (selector, declarations, sheetIdName = 'dynamic-style-element') {

// See:
// https://philipwalton.com/articles/idle-until-urgent/
// Prevent long-running tasks by using setTimeout() to break tasks up:
    window.setTimeout(function () {

        var dynamicStyleSheet;
        var fragment;
        var isNumeric;
        var lastCssRuleIndex;
        var position;
        var propertiesArray;
        var propertiesMatch;
        var regex;
        var regexMatch;
        var rule;
        var sameArrayContents;
        var selectorExists;
        var styleElement;

        if (selector && declarations) {

// CLOSURE COMPILER EXPECTS ALL ARGUMENTS TO BE PROVIDED WHEN FUNCTION
// IS CALLED, UNLESS DEFAULT VALUES ARE PROVIDED IN FUNCTION DEFINITION,
// SIGH...
//
// Default for 'sheetIdName', in case no argument is provided when function
// is called:
//    sheetIdName = (
//        (sheetIdName === undefined)
//        ? 'dynamic-style-element'
//        : sheetIdName
//    );

// helper functions:
            lastCssRuleIndex = function (sheet) {
                return sheet.cssRules.length;
            };

            isNumeric = function (value) {
                return !Number.isNaN(value - parseFloat(value));
            };

            sameArrayContents = function (array1, array2) {
                return (array1.length === array2.length) && (array1.every(function (value, index) {
                    return value === array2[index];
                }));
            };

            styleElement = document.querySelector('#' + sheetIdName);

// If dynamicStyleSheet variable with unique ID doesn't yet exist, create it
// (here, '#dynamic-style-element' by default):
            if (!styleElement) {
                fragment = document.createDocumentFragment();
                styleElement = document.createElement('style');
                fragment.appendChild(styleElement);
// Add unique ID:
                styleElement.setAttribute('id', sheetIdName);
// Append it to the head.
                document.head.appendChild(fragment);
            }

// Save the reference to the sheet.
            dynamicStyleSheet = styleElement.sheet;

// Reconstruct the 'selector' argument with only one space character between
// consecutive attributes:
            selector = selector.split(/\s+/).join(' ');
// We also must ensure the 'declarations' argument has the correct formatting,
// e.g., '{ max-height: 10px; color: blue; }'
// So, first remove all '{' and '}' characters and trim the result:
            declarations = declarations.replace(/[{}]/g, '').trim();
// Next, ensure that the last style property ends in a semicolon:
// 2021-11-28:
// substr() is deprecated!
// OLD:                    if (declarations.substr((declarations.length - 1), 1) !== ';') {
// substr(x, y) -> substring(x, x + y)
// ((declarations.length - 1) + 1) === declarations.length
            if (declarations.substring((declarations.length - 1), declarations.length) !== ';') {
                declarations += ';';
            }
// Then reconstruct the declarations argument with a single space character
// between each attribute:
            declarations = '{ ' + declarations.split(/\s+/).join(' ') + ' }';
// Now construct the CSS rule from the properly formatted 'selector' and
// 'declarations' arguments:
            rule = selector + ' ' + declarations;

// Now, extract the properties ('margin-top', etc.) from the declarations
// block.
// NB: The values are unimportant.
// Finds strings of non-white-space characters ending in colons:
            regex = /(\S+):(?!\S+)/g;
            propertiesArray = [];
            regexMatch = regex.exec(declarations);
            while (regexMatch !== null) {
                propertiesArray.push(regexMatch[1]);
                regexMatch = regex.exec(declarations);
            }

// Next, see whether the selector already exists in the dynamic style sheet.
// Set variables:
            selectorExists = false;
            propertiesMatch = false;
// Cycle through the dynamic style sheet;
// look for matching selectors, and then determine whether the style settings
// are different or not:
            Object.keys(dynamicStyleSheet.cssRules).forEach(function (key) {
                var sheetPropertiesArray;
                var sheetSelector;

// Does the selector text match? If so, then are there the same properties
// ('margin-left', etc.) in the rule set?
// --> We want to replace an existing rule-set if the selector is the same and
// all of the properties are the same, regardless of their attributes!

// Each sheet has a selector (e.g., 'body .my-class')
// For that selector, reconstruct the rule:
                sheetSelector = dynamicStyleSheet.cssRules[key].selectorText;

// Does the sheetSelector match the selector in the rule set being processed
                if (sheetSelector === selector) {
// Fill sheetPropertiesArray with all properties (but not values!) for the
// sheetSelector under consideration:
                    sheetPropertiesArray = [];
// The initial indices in the array are numeric; they have our declarations,
// and we want those only. In order to break from the forEach loop once we
// reach the non-numeric indices, we'll need to throw an exception in a
// try/catch block to get out of it early:
                    try {
                        Object.keys(dynamicStyleSheet.cssRules[key].style).forEach(function (index) {
                            if (isNumeric(index)) {
                                sheetPropertiesArray.push(dynamicStyleSheet.cssRules[key].style[index]);
                            } else {
                                throw 'End of numeric indices.';
                            }
                        });
                    } catch (ignore) {
// console.log(ignore);
                    }
// If the set of properties (but not values!) is the same between the rule-set
// being processed and the rule-set in the sheet, then we've got a match:
                    if (sameArrayContents(propertiesArray, sheetPropertiesArray)) {
                        selectorExists = true;
                        propertiesMatch = true;
// 'position' records the location in the dynamic styleSheet where the rule to
// be deleted is located:
                        position = key;
                    }
                }
            });

// Now, armed with this info, we may proceed:
// If the selector exists:
            if (selectorExists) {
// And the properties are identical (irrespective of the values!):
                if (propertiesMatch) {
// Delete the old rule...
                    dynamicStyleSheet.deleteRule(position);
// ...and add the new one at the end of the sheet, using our helper function
// (lastCssRuleIndex):
                    dynamicStyleSheet.insertRule(rule, lastCssRuleIndex(dynamicStyleSheet));
                }
            } else {
// If the selector isn't there at all, just add the new rule to the end of the
// sheet:
                dynamicStyleSheet.insertRule(rule, lastCssRuleIndex(dynamicStyleSheet));
            }

        } else {
            console.log('Error: No selector or declarations provided in call to appendToCSS');
        }

    }, 0);

};
