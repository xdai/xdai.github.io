---
title:  Definition of INT_MIN
date:   2015-07-16 00:52
categories: "Three Things"
---

It is well known that a 32bit int can represent integer domain
`[-2147483648, 2147483647]`. Look into `/usr/include/limits.h`, we can
find the definition for constant `INT_MIN` and `INT_MAX`:

{% gist xdai/44ce27dd19d314b8a2cf limits.h %}

`INT_MAX` looks pretty straightforward, but `INT_MIN` is a little bit
weird. Why it is not defined like this:

{% gist xdai/44ce27dd19d314b8a2cf fail_limits.h %}

Well, the question arise because of the wide spread confusion between
`integer constant` and `constant expression`. The C standard says:

> An integer constant begins with a digit, but has no period or
> exponent part. It may have a prefix that specifies its base and a
> suffix that specifies its type.
>
> A decimal constant begins with a nonzero digit and consists of a
> sequence of decimal digits. An octal constant consists of the prefix
> 0 optionally followed by a sequence of the digits 0 through 7
> only. A hexadecimal constant consists of the prefix 0x or 0X
> followed by a sequence of the decimal digits and the letters a (or
> A) through f (or F) with values 10 through 15 respectively.

Read it carefully and you will realize that the standard doesn’t
mention the `sign`. So `-2147483648` is not an `integer
constant`. Instead, it is a `constant expression` consisting of unary
minus operator `-` and `integer constant` `2147483648`. To be more
clear, the AST (Abstract Syntax Tree) of `-2147483648` should be (A)
below instead of (B).

![](https://farm1.staticflickr.com/494/19736059105_187147883b_m.jpg){:
 .center-image}

Now what do we have? An `integer constant` `2147483648`. This looks
suspicious as it is bigger than `INT_MAX` and can not be represented
by `int`. So what should be its type? The C standard says:

> The type of an integer constant is the first of the corresponding
> list in which its value can be represented.

For unsuffixed decimal, the list is

* C89: `int, long int, unsigned long int`
* C99: `int, long int, long long int`

So `2147483648` is `unsigned long int` in C89. The standard also says:

> The result of the unary `-` operator is the negative of its
> (promoted) operand. The integer promotions are performed on the
> operand, and the result has the promoted type.

It means the negation of `unsigned` type is still `unsigned`. Try
this:

{% gist xdai/44ce27dd19d314b8a2cf unsigned.c %}

Therefore `-2147483648` is `unsigned long int` in C89, which is
obviously not what we want.

In C99, `2147483648` is `long long int`, so `-2147483648` is `long
long int` as well, which is also not what we want.

Try this out with both C89 and C99 and see the difference.

{% gist xdai/44ce27dd19d314b8a2cf test.c %}

## Reference
1. SO [question 1](http://stackoverflow.com/questions/14695118/2147483648-0-returns-true-in-c) and [question 2](http://stackoverflow.com/questions/12620753/why-it-is-different-between-2147483648-and-int-2147483648)
2. [http://www.hardtoc.com/archives/119](http://www.hardtoc.com/archives/119)
