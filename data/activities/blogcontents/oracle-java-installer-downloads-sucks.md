# How to install `oracle-java8-installer` faster

I used to use `openjdk`, which is very easy to install. You basicially just need

    sudo apt-get install openjdk-8-jre

However, today I need to run `freemind` and that software seems to have problems with `openjdk`. So I decided to replace `openjdk` with
oracle official java.

However, when I [install `oracle-java8-installer`](http://www.webupd8.org/2012/09/install-oracle-java-8-in-ubuntu-via-ppa.html), it seems to download very slow:

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/download-slow.png)

Now I thought: How to make it faster? Maybe I can download the stuff myself using some other tools like `aria2` and replace its cache?

I tried to use `ctrl+c` but nothing happens. So I killed `dpkg`:

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/kill-dpkg.png)

The first thing to do is to find out where `oracle-java8-installer` stores the downloaded file. In the output it said that the file is saved as `jdk-8u72-linux-x64.tar.gz`:

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/found-tgz.png)

Now replace the cached file with the downloaded one using cp, and run the installer again using `dpkg --configure -a`:

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/reconfig-faild-shamismatch.png)

It said that "sha256sum mismatch", so lets check if anything strange happened by checking the sha256 manually:

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/check-sha-1.png)

Looks! File has changed! I don't know what happened, but lets `cp` it again:

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/cp-again-sha-still-mismatch.png)

See? After `cp`ing it again, the checksum still mismatch.. Looks like it is constantly changing.. Let's see:

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/sha-changing.png)

Looks like the downloading process of the installer haven't stopped, use `fuser` to check:

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/fuser-found-wget.png)

Oh.. there is still a `wget` running on the cached file.. Let's kill it and `cp` the file again:

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/kill-wget.png)

Run java installer again:

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/java-installed.png)

Wow!

----

Notes:

* You can kill `dpkg` to stop the java installer.
* use `find` in `/usr`, `/var` and `/tmp` is likely to find the cache file.
* use `fuser` to check what process opened the file.
* After stopping installer, check if downloading stops.
* `dpkg --configure -a` to restart it.

----

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/freemind-no-java.png)

Oops.. Looks like there is still some problem. `freemind` didn't find the jre installed. Check its `man` page and found this:

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/man-freemind.png)

Basicially run it with `JAVA_HOME` set to the jre directory should work.

![](https://static.maowtm.org/blog/oracle-java-installer-downloads-sucks/freemind-run.png)
