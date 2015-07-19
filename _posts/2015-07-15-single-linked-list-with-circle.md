---
layout: post
title:  Single linked list with circle
date:   2015-07-15 17:05
categories: "Three Things"
---

This is a classical interview question, but it is very useful in
practice as well. So let’s discuss it here in detail. The problem is
like this:

> Given a single linked list, how to determine whether it has a circle
> or not?

The solution is intuitive: point two pointers, `fast` and `slow`, to
the head of the list, then use them simultaneously to traverse the
list. `fast` and `slow` advance `m` and `n` steps each time
respectively, $$m>n>0$$. If `slow` catches up with `fast` before
`fast` reaches the end of the list, we can claim that there is a
circle in the list.

It is obvious that `slow` will never catch up with `fast` if the list
has no circle, i.e. $$\lnot\text{Circle}\to\lnot\text{CatchUp}$$. Now
let’s prove that `slow` will finally catch up with `fast` if the list
indeed has a circle, i.e. $$\text{Circle}\to\text{CatchUp}$$.

Suppose the list is composed of a linear part and a circle, the length
of which are `l` and `c` respectively. Assume `slow` catches up with
`fast` in `s` steps, then we have $$((m \times s – l) \mod c)=((n
\times s – l) \mod c)$$. Put this in another way:

$$
\begin{align*}
m \times s - l &= p \times c + r \\
n \times s - l &= q \times c + r
\end{align*}
$$

Solve the equation we get

$$
s = \frac{(p-q) \times c}{m-n}
$$

There is nothing to stop us to pick up `p` and `q` such that $$p−q=l
\times (m−n)$$. So `s` has at least one solution, $$l \times c$$,
which satisfies all the constrains below:

$$
p > q \ge 0 \\
m > n > 0   \\
c > 0       \\
l \ge 0     \\
r < c
$$

Therefore `slow` will catch up with `fast` in $$l \times c$$ steps,
though this is not necessarily the first time they meet again.

So we just proved $$\text{Circle}\to\text{CatchUp}$$. Now comes the
follow up question:

> How to find the beginning of the circle?

Let `A` be the head of the list, `B` be the beginning point of the
circle, and `C` be the catch up point of `slow` and `fast`, then the
list looks like this:

![](https://farm1.staticflickr.com/350/19732022985_57c074fb47.jpg){:
 .center-image}

If we choose `m=2` and `n=1`, solve the equation above we can get
`l+r=(p-2q)c`. Let `α=p-2q`, then `l+r=αc`, `l=αc-r=(α-1)c+k`. Now we
put a pointer `p0` on `A`, a pointer `p1` on `C`, then advance them 1
step every time. After `k` steps, `p0` is `(α-1)c` steps away from
`B`, but `p1` reaches `B` already. Therefore, after `(α-1)c` more
steps, `p0` and `p1` meet with each other on `B`.

## Reference

1. [Floyd’s cycle-finding algorithm (or "tortoise and the hare algorithm")](https://en.wikipedia.org/wiki/Cycle_detection#Tortoise_and_hare)
