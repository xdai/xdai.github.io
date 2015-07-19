---
title:  Ternary operator madness
date:   2015-07-15
categories: "Three Things"
---

Life is full of surprise. Things get even messier with implicit type
conversion. Let’s talk about the ternary operator (or conditional
operator) `?:` in C.

What is the value of `1?-1:1`? It is obvious, isn’t it? How about
`1?-1:1U`? "The same", I hear your voice. So `(1?-1:1)==(1?-1:1U)`
must be true, as well as `(1:-1:1)<0 && (1:-1:1U)<0`. If you believe
that is the truth here, try it out and you will be surprised. (No I
will not paste the answer here, try it out by yourself so you can
remember:)

So the problem here is obviously caused by `U`, which is the only
difference between those two expressions. `-1` and `1` are `int`,
while `1U` is `unsigned int`. When we mix them together in an
expression, `int` will be promoted to `unsigned int`. So actually we
get `-1` for `1?-1:1` but `(unsigned int)-1` for `1?-1:1U`. Now
everything is clear: this is all about type
promotion. [Nigel Jones](http://embeddedgurus.com/embedded-systems-bloggers/nigel-jones/)
wrote an essay[^1] on this topic in which he provided another
interesting example:

{% gist xdai/deddb1e6a0db2dbe07c4 unsigned.c %}

Why do we need the type promotion in this case? Can we just return
`-1` or `1U` for `cond?-1:1U`? One way to think about this is that C
is statically typed. The type of `cond?-1:1U` is determined in compile
time. It can not be "either `int` or `unsigned int`". We need to
cast/promote one type to another and from `int` to `unsigned int` is
the nature choice. It is an error if the type casting can not be
performed in a meaningful way. For example, if `a` is `int` and `b` is
`struct`, then compiler will give us an error for `cond?a:b`.

At last, as a bonus point, `?:` in C is slight different from in
C++[^2]. `?:` can return a `lvalue` in C++ but not in C. That is to
say, the snippet below is valid only for C++.

{% gist xdai/deddb1e6a0db2dbe07c4 lvalue.cpp %}

However, changing `a` to be `unsigned int` makes the code invalid even
for C++:

{% gist xdai/deddb1e6a0db2dbe07c4 lvalue-fail.cpp %}

Here `b` will be cast to `unsigned int`. An intermediate variable must
be created to store the casting result. Why? Consider the case when we
cast from `char` to `int`, the original variable can not be reused
because it is not long enough to hold an `int`. As there is no way for
programmer to reference the intermediate variable, it is meaningless
to allow it can be used as `lvalue`. In general, `(int)a=1;` is
invalid for both C and C++.

## Reference
[^1]: [A tutorial on signed and unsigned integers](http://embeddedgurus.com/stack-overflow/2009/08/a-tutorial-on-signed-and-unsigned-integers/)
[^2]: [Conditional operator differences between C and C++](http://stackoverflow.com/questions/1082655/conditional-operator-differences-between-c-and-c)
