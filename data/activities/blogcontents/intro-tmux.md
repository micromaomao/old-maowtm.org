# Intro to Tmux: Stop Opening And Laying Out Lots Of Terminal Windows.

![Tmux](https://static.maowtm.org/blog/intro-tmux.png)

When I haven't meet [tmux](https://tmux.github.io/), I have several terminal tabs. One for vim, one for compilie and other command
line stuff, and one for `man`. It is a bit inconvenient for me to switch between tabs, and I can only look at one tab at once.

Tmux is a easy-to-use tool to simulate terminals in one terminal. You can sort of create a terminal in it, and display two terminal
together. Moving cursor between simulated "terminals" is very easy. Lets get started.

## Installation

I use [Ubuntu](http://www.ubuntu.com/desktop) as my OS, and I was able to install just by downloading it from the built-in apt repository:

    sudo apt-get install tmux

The above command also work on Raspberry Pi, which made it easy to set up a must-have environment for Raspberry Pi. Also as tested out,
`yum install tmux` also work on [CentOS](https://www.centos.org/).

In case you can't get it from your package manager, you can still download the source and compile it on the [tmux project page](https://tmux.github.io/).

## Getting started

When you get tmux installed on your computer, open a terminal and type in:

    tmux new-session

You should see a green bar appeared on the bottom of your terminal. It is the "status bar" of tmux. You should see a `[0]` on the left of this bar,
and the name of your shell with a number before it. You may also see your computer's time in the right of the bar.

Let's not care about it now. You want to know how to display two "terminal" in one terminal now, don't you? Now type in the following:

    tmux split-window

You should see another "terminal" pop up, taking the bottom half space of your terminal. You can type in commands in this new simulated
"terminal". In fact, tmux call it a "pane". Now you have two pane, the one on the top of your terminal and another one on the bottom.

![Two pane](https://static.maowtm.org/blog/intro-tmux/two-pane.png)

## Panes

Tmux will close the pane once your shell exit. Now use `ctrl+d` to end your shell. You should now have only one pane.

It will be too painful if whenever you want to split your window you need to use a command. Tmux knows that and it have a shortcut key for that:
first press `ctrl+b`, release it and then press `"`, which is `shift-'`. You should see the same effect as using the previous command. Once you get
used to it, you will remember it easily.

Ok, what if you want to do it horizontally? The command way to do it is `tmux split-window -h`, which `-h` means horizontally. The shortcut way is
`ctrl-b %`. Try it out yourself so you will remember it, at least have a impression. Don't forget that you can use `ctrl-d` to end a shell, which close
the pane.

Tmux allow you to split a pane. By spliting multiple times, you can get this:

![Split multiple times](https://static.maowtm.org/blog/intro-tmux/split-multiple.png)

Try it out to help you remember the two shortcuts.

    ctrl-b " ctrl-b % ctrl-b " ctrl-b % ctrl-b " ctrl-b %

To return to the starting one-pane status, close all other pane by `ctrl-d`ing several times.

![All pane closed](https://static.maowtm.org/blog/intro-tmux/all-pane-closed.png)

**Oops!** Looks what just happened. I accidentally press a extra `ctrl-d`, and I closed the last window left. Tmux then `[exited]`.

When you get into tmux, you started a "session". A window exit when you closed the last pane of it, and a session ends when you exit the last window.

Now let's restart our session by running tmux again. In fact you can just run tmux with no arguments:

    tmux

This will just create a new session.

OK, let's continue our window spliting exercise. You probably wondering how to move cursor between panes, which is very easy. You just need to press
`ctrl-b`, release it then press arraw keys. `ctrl-b up` means move cursor to the pane above, etc. You now should be able to do this:

![Grid exercise](https://static.maowtm.org/blog/intro-tmux/grid-exercise.png)

Looks silly, but it will let you remember these shortcuts quickly.

Now carefully press `ctrl-d` the right number of times to return to the starting one-pane layout. You should now be able to get used to tmux.

## Windows

Now lets try out the following:

    tmux new-window

Now you have entered a new shell. Seems like another new session, but you could see the text in the green status bar changes:

![Status bar changes](https://static.maowtm.org/blog/intro-tmux/status-bar-two-windows.png)

It means that now you have 2 windows: the first window is window number 0, which have a name of `zsh`. The second window is window
number 1, which also have a name of `zsh`.

A window contain a layout of panes. The shortcut for creating window is `ctrl-b c` and for switching is `ctrl-b` and the window number. You can switch
to the first window by `ctrl-b 0`, and you will see the command you just typed in. You can create and layout panes in each window. Don't forget that
closing a window means closing all panes in it.

## More...

This article is just a "introduction". There are way more things you can do with tmux. You can see the manual page of tmux by running
`man tmux`. The document describe all these things in a deeper way. Although you are now able to make use of tmux in your developing, be sure
to check the manual out. There are many things, for example switching to the number 10 window, swaping panse and moving panse between windows, that I haven't
mentioned.
