# How [maowtm.org](https://maowtm.org/) is built: Things to mention

## Node

This website uses [node.js](https://nodejs.org/). There isn't any problems when installing it through `apt-get` in ubuntu and I got node
v4.2.6 which is good enough for me. But my server is running [CentOS](https://www.centos.org/) which use `yum`. However, by `yum install nodejs`
I can only get node v0.10.x. I finally downloaded the binaries from [Node.js download page](https://nodejs.org/en/download/) and everything works fine.

## SSL

You can submit your website for preloading https on the [HSTS Preload Submission](https://hstspreload.appspot.com/) page. Once you domain get preloaded,
chrome, firefox and probably IE will load the https version of your site automaticly even if it never load anything from your site before. Also, use
[ssllabs online server test](https://www.ssllabs.com/ssltest/) or other SSL testing services to test if there is any security vulnerability on your
SSL-protected website.

You can get free multi-domain certification by using [Let's Encrypt](https://letsencrypt.org/) which is a CA which offer free SSL certifications. I
recommend the [letsencrypt-nosudo](https://github.com/diafygi/letsencrypt-nosudo) client which just takes in a `csr`, do some authenticate and output out
a `crt`.

## Local testing

My site use multiple domains and I want to handle all these domains in one node.js app. To make things easy, I just write my app as I'm running it on server.
Check http `host` with the actual `maowtm.org` domain. Then when I need to run my site locally I just edit my `/etc/hosts` file to resolve these domains to
`localhost`. Also after I changed `/etc/hosts`, I need to first clear the chrome DNS cache and then close all chrome idle sockets. These tasks can be done in
`chrome://net-internals/#dns` and `chrome://net-internals/#sockets`.

## Trailing `/`

`https://maowtm.org/auth` is very different from `https://maowtm.org/auth/`. If the url is `https://maowtm.org/auth`, all relative path will be relative to
`https://maowtm.org/`. However, if the url is `https://maowtm.org/auth/`, it will be relative to `https://maowtm.org/auth/`. I simply redirect all URL without
trailing `/` to the corresponding with `/` version. ( Not redirected on `static.` and `img.maowtm.org`. )

## Timezone

In node.js if you want to represent a `Date` value, specify a timezone like `Tue Feb 02 2016 22:42:32 GMT+0800` so that nothing will go wrong even if your
server is in a different timezone than you. Also when sending clients `Date`s use `date.getTime()`. It will return the UTC time which your client using
`new Date()` can than convert to their own timezone.

## Web fonts

By using [Google Web Fonts](https://www.google.com/fonts), you can use any beautiful fonts you like in your website, without needing to worry about whether or
not user have that font installed, and without hosting `@font-face` font files on your server.
