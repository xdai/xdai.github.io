---
title:  Secure web proxy with squid and chrome (a.k.a. A way to break the GFW)
date:   2013-03-08
categories: [ThreeThings]
tags: [GFW, Proxy]
---

The well known China Great Firewall (GFW) blocks the access to several
web services from China, such as Facebook, Twitter, and Youtube.
Personally, I have no interest in using Facebook or Twitter, and I
hardly watch online video streams. So it is not a big trouble for me.
However, the GFW will cause the infamous TCP RST issue when using
google. This is unacceptable since it will dramatically decay the
efficiency of every programmer.

<!-- more -->

Thanks to my wife, I obtained root access to an ubuntu server hosted
in U.S. and am able to setup a proxy server to break the GFW. The
following paragraphs details some key points of the procedure.

First of all, one must be noted that a traditional http proxy server
setup will **NOT** work in this case. The data flow between our web
browser and the proxy server is not encrypted, hence it is still
vulnerable to the keyword based GFW filter. So we must encrypt this
data channel to protect the data from been recognized by GFW keyword
filter.

The famous proxy software [Squid](http://www.squid-cache.org) provides
the capability to protect the data flow with SSL. However, this
feature is not built in the squid provided by some linux
distribution. To check whether squid installation supports this
feature or not:

~~~
$ squid -v | grep -- '--enable-ssl'
~~~

If the squid is not configured with the option `–enable-ssl`, we
should build one from source with this configure option enabled.

The only vital directives in squid.conf to enable SSL is `https_port`:

~~~
https_port 443 cert=/etc/squid3/limitedwish.org.crt key=/etc/squid3/limitedwish.org.key
~~~

This directive designates the port number used by SSL secured data
channel as well as the certificate and the corresponding private
key. The certificate can be self-signed for personal use:

~~~
$ openssl genpkey -out limitedwish.org.key -algorithm rsa
$ openssl req -new -key limitedwish.org.key -out limitedwish.org.csr
$ openssl x509 -req -days 365 -in limitedwish.org.csr -signkey limitedwish.org.key -out limitedwish.org.crt
~~~

The first command generates a RSA private key. The next command
creates a CSR (Certificate Signing Request) using this private
key. Openssl will ask you for several information, the most important
of which is the “Common Name”. Make sure you provided the correct FQDN
of the proxy server, otherwise the certificate will be denied by your
browser. The last command will use the CSR and the private key to
generated a self-signed certificate which is good for 365 days.

We can tune other directives in squid.conf to fit our needs, e.g. add
user authentication. However, `https_port` is the most vital one.

Now we need to ask the browser to talk with our proxy server via SSL
protected channel. Unfortunately, most of the browsers have no such
feature built in (try [stunnel](https://www.stunnel.org) if those
browsers are prefered). The only browser with such capability is the
Google Chrome as far as I know.

~~~
$ chrome --proxy-server=https://proxy.limitedwish.org:443
~~~

Since the certificate is self-signed, chrome will deny it and report
`Error 136 (net::ERR_PROXY_CERTIFICATE_INVALID): Unknown error.`. We
should add just created certificate into trusted certificate list of
our OS or browser. In Mac, this can be achieved by import the
certificate into the keychain. Also, please make sure this certificate
is trusted when used by SSL.

Now it should be all set. Connect to Youtube to check if everything
works :)

## Reference

1. [Some technical overview about the GFW](http://wiki.keso.cn/Home/across-the-gfw-s-technology-and-control-method)
2. [How to create a self-signed SSL certificate](http://www.akadia.com/services/ssh_test_certificate.html)
3. [Chrome Secure Web Proxy](http://www.chromium.org/developers/design-documents/secure-web-proxy)
4. [How to pass command line arguments to Mac OSX Apps](http://superuser.com/questions/271678/how-do-i-pass-command-line-arguments-to-dock-items)
