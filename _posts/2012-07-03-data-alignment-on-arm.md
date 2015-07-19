---
layout: post
title:  "Data alignment on ARM"
date:   2012-07-03
categories: "Three Things"
---
First of all let’s check the demo code below:

{% gist xdai/14a18c3781deda8a06fb tst.c %}

Compile and run on ARM926EJ-S:

~~~
$ arm-linux-gcc -o tst tst.c
...
<copy to arm board>
...
# ./tst
0x80000:0x39020000
0x800:0x390200
~~~

Surprise, isn’t it? Well, let’s check the address of the array
`ReqBuffer[]`:

~~~
$ arm-linux-nm tst | grep ReqBuffer
00010741 B ReqBuffer
~~~

So, it’s not word-aligned. What if we force it to be aligned on word
boundary? After modifying line 14 into `uint8_t ReqBuffer[100]
__attribute__ ((aligned (4)));`:

~~~
$ arm-linux-gcc -o tst tst.c
$ arm-linux-nm tst | grep ReqBuffer
00010744 B ReqBuffer

# ./tst
0x80000:0x39020000
0x80000:0x39020000
~~~

Now we get expected result, but why? We need to delve into “ARM
Architecture Reference Manual” to get some insight. ARM926EJ-S is
ARMv5 based, and in “A2.8 Unaligned data access” it said:

> Prior to ARMv6, `doubleword` (`LDRD`/`STRD`) accesses to memory,
> where the address is not `doubleword`-aligned, are
> UNPREDICTABLE. Also, data accesses to non-aligned `word` and
> `halfword` data are treated as aligned from the memory interface
> perspective. That is:
>
> * the address is treated as truncated, with address `bits[1:0]`
>   treated as zero for `word` accesses, and address bit[0] treated as
>   zero for `halfword` accesses.
> * load single word ARM instructions are architecturally defined to
>   rotate right the word-aligned data transferred by a non
>   word-aligned address one, two or three bytes depending on the
>   value of the two least significant address bits.
> * alignment checking is defined for implementations supporting a
>   System Control coprocessor using the A bit in `CP15`
>   register 1. When this bit is set, a Data Abort indicating an
>   alignment fault is reported for unaligned accesses.

To understand first two of the statements, it would be better to try
it out.

{% gist xdai/14a18c3781deda8a06fb align.c %}

~~~
$ arm-linux-gcc -o align align.c

# ./align
0x10828 00 00 00 00 11 22 33 44 0x10828 11223344
0x10828 00 00 00 00 11 22 33 44 0x10829 44112233
0x10828 00 00 00 00 11 22 33 44 0x1082a 33441122
0x10828 00 00 00 00 11 22 33 44 0x1082b 22334411
0x10828 11 22 33 44 00 00 00 00 0x1082c 11223344
0x10828 11 22 33 44 00 00 00 00 0x1082d 44112233
0x10828 11 22 33 44 00 00 00 00 0x1082e 33441122
0x10828 11 22 33 44 00 00 00 00 0x1082f 22334411
~~~

As you can see, if the word pointer is not word-aligned, the value you
read out is not necessarily to be equal with the one you write into
previously. The behavior is annoying and may lead to program bug which
is not easy to find out, just like the one we demoed in the beginning
of the article.

Linux provided a software workaround for this issue. It’s implemented
based on Data Abort exception. If the A bit of `CP15` register 1 is
set, a Data Abort will be reported for unaligned data access. So, when
Linux Kernel captured a Data Abort, it will check `CP15` register 5
(Fault Status Register, `FSR`), if it turns out that the Data Abort is
caused by unaligned data access, the Kernel will try to fix the data
access on the fly. For Linux Kernel 2.6.28, the fixup for unaligned
data access in kernel space is mandatory, but for user space
application, the behavior can be configured via
`/proc/cpu/alignment`. Valid configurations are: 0 for `ignored`, 1
for `warn`, 2 for `fixup`, 3 for `fixup+warn`, 4 for `signal`, 5 for
`signal+warn`:

~~~
# echo 0 >/proc/cpu/alignment
# ./align
0x10828 00 00 00 00 11 22 33 44 0x10828 11223344
0x10828 00 00 00 00 11 22 33 44 0x10829 44112233
0x10828 00 00 00 00 11 22 33 44 0x1082a 33441122
0x10828 00 00 00 00 11 22 33 44 0x1082b 22334411
0x10828 11 22 33 44 00 00 00 00 0x1082c 11223344
0x10828 11 22 33 44 00 00 00 00 0x1082d 44112233
0x10828 11 22 33 44 00 00 00 00 0x1082e 33441122
0x10828 11 22 33 44 00 00 00 00 0x1082f 22334411
# echo 2 >/proc/cpu/alignment
# ./align
0x10828 00 00 00 00 11 22 33 44 0x10828 11223344
0x10828 00 00 00 11 22 33 44 00 0x10829 11223344
0x10828 00 00 11 22 33 44 00 00 0x1082a 11223344
0x10828 00 11 22 33 44 00 00 00 0x1082b 11223344
0x10828 11 22 33 44 00 00 00 00 0x1082c 11223344
0x10828 22 33 44 00 00 00 00 00 0x1082d 11223344
0x10828 33 44 00 00 00 00 00 00 0x1082e 11223344
0x10828 44 00 00 00 00 00 00 00 0x1082f 11223344
# echo 4 >/proc/cpu/alignment
# ./align
0x10828 00 00 00 00 11 22 33 44 0x10828 11223344
Bus error
~~~

ARMv6 added support for unaligned `word` and `halfword` load and store
data access.

> ARMv6 introduces unaligned word and halfword load and store data
> access support. When this is enabled, the processor uses one or more
> memory accesses to generate the required transfer of adjacent bytes
> transparently to the programmer, apart from a potential access time
> penalty where the transaction crosses an IMPLEMENTATION DEFINED
> cache-line, bus-width or page boundary condition. Doubleword
> accesses must be word-aligned in this configuration.

The feature can be configured by U bit and A bit of CP15
register 1. Once it’s enabled, the behavior is just the same as Linux
Kernel fixup for end user.
