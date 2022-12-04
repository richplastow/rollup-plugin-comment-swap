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
