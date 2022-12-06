import Filetype from './types/filetype';

export function pathToFiletype(
    path: String
): Filetype {
    const lcPath = path.toLowerCase();

    if (lcPath.slice(-4) === '.css')
        return Filetype.Css;
    if (lcPath.slice(-4) === '.htm')
        return Filetype.Html;
    if (lcPath.slice(-5) === '.html')
        return Filetype.Html;
    if (lcPath.slice(-3) === '.js')
        return Filetype.Js;

    return Filetype.Other;
}

// Test whether source code contains at least one of the following five strings:
//     /*=   =*/   /*$   $*/   ?*/
// At least one of these will be present in a CSS or JS file which uses Comment Swaps.
export function codeContainsCssJsCommentSwap(
    code: string
): Boolean {
    for (const str of ['/*=', '=*/', '/*$', '$*/', '?*/'])
        if (code.indexOf(str) !== -1)
            return true;
    return false;
}

// Test whether source code contains at least one of the following five strings:
//     <!--=   =-->   <!--$   $-->   ?-->
// At least one of these will be present in an HTML file which uses Comment Swaps.
export function codeContainsHtmlCommentSwap(
    code: string
): Boolean {
    for (const str of ['<!--=', '=-->', '<!--$', '$-->', '?-->'])
        if (code.indexOf(str) !== -1)
            return true;
    return false;
}
