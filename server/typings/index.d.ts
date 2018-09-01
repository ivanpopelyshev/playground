/// <reference path="../../typings/app.d.ts" />

type TErrCallback = TCallback1<NodeJS.ErrnoException>;
type TErrCallback1<T1> = TCallback2<NodeJS.ErrnoException, T1>;
type TErrCallback2<T1, T2> = TCallback3<NodeJS.ErrnoException, T1, T2>;

declare module 'restify-cors-middleware' {
    let fn: (config: any) => any;

    export = fn;
}
