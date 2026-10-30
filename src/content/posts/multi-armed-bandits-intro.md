---
title: "多臂老虎机入门：从 Regret 到 Explore-Then-Commit"
description: "把 Lecture 3b 的十页手写讲义整理成一条线：bandit 的博弈设定、why expected value、均值与最优臂、regret 的三种等价写法与分解公式，最后落到 ETC 算法和它的动作序列。"
date: 2026-10-30
tags: ["多臂老虎机", "强化学习", "探索与利用", "Regret", "学习笔记"]
featured: false
lang: "zh-CN"
---

> **材料**：10 页手写讲义，主题 *Introduction to Multi-armed Bandit Algorithms*（ML-DM，October 2026，Lecture 3b）。
> **这份笔记做什么**：把讲义里散在 10 页上的定义、公式和例子串成一条推理链，并补上中英术语对照。
> **读法**：先看第 0 节的路线图；只想抓公式就看第 6 节速查；想搞清 regret 为什么能分解，读第 4 节。

---

## 0. 一条线看懂这十页

讲义的推进顺序非常干净，本质上是四步：

```text
设定问题        learner 每轮选一个臂，只看得到被选中臂的奖励        （第 1 节）
   ↓
确定目标        累积奖励是随机变量 → 用期望当效用                     （第 2 节）
   ↓
定义差距        均值 μa、最优臂 a*、次优间隙 Δa                       （第 3 节）
   ↓
量化损失        regret = n·μ* − E[ΣXt]，并可改写成按臂求和            （第 4 节）
   ↓
给一个算法      Explore-Then-Commit：先轮转探索，再锁定最优            （第 5 节）
```

| 原页 | 主题 |
|---|---|
| 1 | 问题设定：learner vs. environment，horizon，regret 的第一种写法 |
| 2 | Exploration–Exploitation dilemma；MAB 与 RL 的区别 |
| 3 | Stochastic stationary bandits（经典设定）；学习目标与效用函数 |
| 4 | 伯努利奖励例子；均值 μa、最优臂 a*、μ* |
| 5 | Regret 的定义与三种等价写法；对数 regret |
| 6 | 对数 regret 的概率含义；regret decomposition 的开头；指示函数 |
| 7 | 次优间隙 Δa；Regret Decomposition Formula；remark |
| 8 | 1-sub-Gaussian 假设；尾概率；ETC 的两阶段 |
| 9 | ETC 算法伪代码；经验均值 μ̂i(t) |
| 10 | k=5, m=3 的动作序列例子；commit 阶段 |

十页原图按原顺序收在文末 **第 10 节「手稿原页」**，正文提到「原页 N」时可以直接对照。

---

## 1. 问题设定：一场 learner 与 environment 的序列博弈

### 1.1 记号

| 符号 | 英文 | 含义 |
|---|---|---|
| $n$ | horizon | 总轮数，讲义里也叫 the horizon |
| $t$ | round | 第几轮，$t=1,2,\dots,n$ |
| $\mathcal A$ | set of available actions (arms) | 可选动作集，$|\mathcal A|=k$ |
| $A_t$ | action taken in round $t$ | 第 $t$ 轮实际选的动作，$A_t\in\mathcal A$ |
| $X_t$ | reward | 第 $t$ 轮拿到的奖励（随机变量） |
| $P_a$ | reward distribution of arm $a$ | 臂 $a$ 的奖励分布 |
| $\mu_a$ | mean (expected) reward | 臂 $a$ 的平均奖励 |
| $a^*$ | best arm | 均值最大的臂（有时记作 $k^*$） |
| $\mu^*$ | largest mean reward | 最优臂的均值 |
| $\Delta_a$ | sub-optimality gap | 次优间隙 $\mu^*-\mu_a$ |
| $T_a(n)$ | action count | $n$ 轮里臂 $a$ 被选了多少次 |

讲义的定义原话是：**A bandit problem is a sequential game between a learner and an environment**——学习器与环境之间的序列博弈，其中环境（或说算法设计者）决定了决策结果的不确定性。

### 1.2 每一轮发生了什么

在第 $t$ 轮，学习器从 $k$ 个可能动作里选一个 $A_t$，然后收到一个随机奖励 $X_t$。关键在于：**只有被选中的那个臂会揭晓奖励**，其余 $k-1$ 个臂的奖励既看不到、也不会补。

### 1.3 Exploration–Exploitation Dilemma（探索与利用的两难）

讲义把它拆成两条互相拉扯的事实：

1. **环境不会揭晓未被选中动作的奖励**。所以想要知道哪个臂好，学习器必须**反复把所有动作都试一遍**——这是 exploration。
2. **一旦选了差动作，累积奖励就被扣掉了**。所以学习器又想**一直用目前表现最好的那个臂**——这是 exploitation。

两句话说完了整个 bandit 的核心矛盾：**信息只能通过「实际去拉」获得，而拉的过程本身要付代价。**

### 1.4 MAB 与强化学习：差在哪

| | 多臂老虎机 Multi-armed Bandits | 强化学习 Reinforcement Learning |
|---|---|---|
| 动作会不会改变环境 | **不会**：动作不改变环境的奖励分布 | **会**：动作可能改变环境与奖励分布 |
| 状态转移 | 没有状态，每轮独立 | 有状态转移，动作影响未来状态 |
| 关系 | **MAB 是 RL 的一个特例** | RL 更一般 |

所以本讲义里所有的 $P_a$ 都是**固定不变**的——这就是第 3 节标题里 stationary（平稳）的含义。

---

## 2. 目标函数：为什么最后落在期望上

设总奖励

$$
S_n=\sum_{t=1}^{n}X_t .
$$

学习者的目标是**最大化累积奖励** $S_n$。但这里有个必须先处理的问题：

> $S_n$ 是**随机变量**，因为每个 $X_t$ 都是随机的。

随机变量之间不能直接比大小，所以我们必须给「$S_n$ 的分布」指定一个**效用（utility）**，把分布压成一个可比较的数。讲义说得很直白：*assign a utility to the distribution of $S_n$*，也就是 quantify how good it is。

**bandit 文献里最常用的效用是期望**（the expected value of $S_n$），于是目标变成：找一个期望累积奖励最大的算法。

$$
\text{maximize}\quad \mathbb E\left[\sum_{t=1}^{n}X_t\right].
$$

但讲义特意留了一句余地：**期望不是唯一合理的选择**。如果应用关心的是「不要输得太惨」，更合适的效用可能是

$$
P\left(S_n \ge \text{threshold}\right),
$$

即「累积奖励达到某个门槛的概率」。这时最优算法可能和最大化期望的算法不同。

> **一句话**：目标函数不是天经地义的，先选效用，再谈最优。讲义后面全部默认用期望。

---

## 3. 均值、最优臂、次优间隙

### 3.1 伯努利例子：广告点击

讲义用广告投放做例子：奖励分布是**伯努利**，参数 $\mu_a$ 未知，

$$
P_a=\begin{cases}
\mu_a, & \text{reward}=1 \quad(\text{用户点了这条广告})\\[2pt]
1-\mu_a, & \text{reward}=0 \quad(\text{用户没点})
\end{cases}
$$

因为伯努利的期望就是参数，所以这里**期望奖励 $\mu_a$ 恰好等于点击率**。这就是为什么 $\mu_a$ 在广告语境下可以直接读成「这条广告的点击率」。

### 3.2 平均奖励的定义

$$
\mu_a=\mathbb E\left[X_t \mid A_t=a\right].
$$

读法：**在「第 $t$ 轮选了臂 $a$」这个条件下，奖励的期望**。竖线右边是条件，不是乘法。

如果奖励分布是离散的，把它摊开成求和：

$$
\mu_a=\sum_{\ell} P\left(\text{reward from arm } a=\ell\right)\cdot \ell .
$$

连续情形同理，把求和换成积分，用密度 $p_a(x)$：

$$
\mu_a=\int x\,p_a(x)\,\mathrm dx .
$$

### 3.3 最优臂与最优均值

$$
a^*=\arg\max_{a\in\mathcal A}\mu_a,
\qquad
\mu^*=\max_{a\in\mathcal A}\mu_a .
$$

- $a^*$ 是**最优臂的下标**（广告语境：点击率最高的那个广告版本）；
- $\mu^*$ 是**所有臂里最大的平均奖励**（最高的那个点击率）。

这两个量在 regret 里分工不同：$\mu^*$ 出现在「本可以拿到多少」里，$a^*$ 出现在「本该一直选谁」里。

### 3.4 次优间隙

$$
\boxed{\Delta_a=\mu^*-\mu_a}
$$

它是**最优臂的平均奖励**与**臂 $a$ 的平均奖励**之差。两个立刻能看出来的性质：

- 对最优臂，$\Delta_{a^*}=0$；
- $\Delta_a\ge 0$ 恒成立，且它衡量的是「每选一次臂 $a$，平均亏多少」。

$\Delta_a$ 是后面 regret decomposition 的**权重**，也是理解「什么样的臂值得多试」的关键量。

---

## 4. Regret：把「亏了多少」写成公式

### 4.1 定义

对任意算法（策略）$\pi$，$n$ 轮后的期望 regret 定义为

$$
\boxed{
R_n(\pi)=n\cdot\mu^*-\mathbb E\left[\sum_{t=1}^{n}X_t\right]
}
$$

三项的含义分别是：

| 项 | 含义 |
|---|---|
| $R_n(\pi)$ | 策略 $\pi$ 在 $n$ 轮里累积的期望 regret |
| $n\cdot\mu^*$ | 如果每轮都拉最优臂，本该拿到的期望累积奖励 |
| $\mathbb E\left[\sum_{t=1}^{n}X_t\right]$ | 我们的策略实际拿到的期望累积奖励 |

所以 regret 就是「**事后知道哪个臂最好**」与「**实际这么做**」之间的期望差。注意基准是 **hindsight 的最优固定臂**，不是最优自适应策略——这一点常被误解。

### 4.2 三种等价写法

把 $n\mu^*$ 拆进求和里：

$$
R_n(\pi)
=\sum_{t=1}^{n}\left(\mu^*-\mathbb E[X_t]\right)
=\sum_{t=1}^{n}\left(\mu^*-\mu_{A_t}\right)
=\sum_{t=1}^{n}\Delta_{A_t}.
$$

从第二行到第三行用了一次**全期望**：$X_t$ 服从 $P_{A_t}$，而 $A_t$ 本身是随机的，所以

$$
\mathbb E[X_t]=\mathbb E\left[\mathbb E[X_t\mid A_t]\right]=\mathbb E\left[\mu_{A_t}\right].
$$

这就是讲义右边那串 $\sum_{t=1}^{n}\left(\mu^*-\mu_{A_t}\right)=\sum_t \Delta_{A_t}$ 的来历。

**目标因此变成**：最小化 $R_n(\pi)$。

### 4.3 「对数 regret」是什么意思

讲义先问：一个好算法的表现该长什么样？

> 答案：**在绝大多数情形下，对数级 regret 已经是最优的了**——没有任何算法能系统性地比 $\log n$ 更好（在随机平稳 bandit 里）。

形式化地，存在常数 $C>0$ 使

$$
R_n\le C\log n
\qquad\Longleftrightarrow\qquad
R_n=O(\log n).
$$

（讲义顺带提醒：不熟 $O(\cdot)$ 的话去看 Landau notation。）

### 4.4 对数 regret 的概率含义

紧接着讲义换了个角度问：**从「次优决策出现的频率」看，对数 regret 意味着什么？**

答案是一条概率条件：

$$
\boxed{
P\left(\text{第 } t \text{ 轮选到次优臂}\right)\lesssim \frac{1}{t}
}
$$

直觉：如果每轮的犯错概率按 $1/t$ 衰减，那么 $n$ 轮累计的期望犯错次数约为

$$
\sum_{t=1}^{n}\frac{1}{t}\approx \ln n,
$$

正好对上 $O(\log n)$。**「regret 是 log 级」等价于「错误率是 $1/t$ 级」**，这条对应关系比公式本身更有用。

### 4.5 Regret Decomposition Formula

主角登场。定义臂 $a$ 在前 $t$ 轮被选的次数：

$$
T_a(t)=\sum_{s=1}^{t}\mathbf 1\left[A_s=a\right],
$$

其中 $\mathbf 1[\cdot]$ 是**指示函数**（indicator function）：

$$
\mathbf 1[E]=\begin{cases}1, & E \text{ 发生}\\ 0, & E \text{ 不发生}\end{cases}
$$

于是 regret 可以**从「按轮求和」改写成「按臂求和」**：

$$
\boxed{
R_n=\sum_{a\in\mathcal A}\Delta_a\,\mathbb E\left[T_a(n)\right]
}
$$

推导只有两行（讲义没写，但值得自己推一遍）：

$$
\sum_{t=1}^{n}\Delta_{A_t}
=\sum_{t=1}^{n}\sum_{a\in\mathcal A}\Delta_a\mathbf 1[A_t=a]
=\sum_{a\in\mathcal A}\Delta_a\underbrace{\sum_{t=1}^{n}\mathbf 1[A_t=a]}_{=\,T_a(n)}
$$

再对两边取期望，即得分解式。

把它读成一句话：

> **总 regret = Σ（每种「选错」的单价 × 这种错被犯了多少次）**

其中「单价」就是间隙 $\Delta_a$。这正是讲义 remark 说的：学习者的目标其实是**最小化期望动作次数的加权和，权重就是次优间隙**。

由此得到一条非常实用的设计原则：

$$
\Delta_a \text{ 越大} \;\Longrightarrow\; \text{应该按比例更少地选它。}
$$

也就是说：**明显很差的臂要少碰，差距小的臂可以多试——试错预算应该花在「还没分清好坏」的臂上。** 这就是 UCB 一类算法「置信上界」思想的源头。

---

## 5. Explore-Then-Commit（ETC）

### 5.1 为什么需要一个分布假设

讲义从这一页起加了一个前提：所有臂的奖励分布都是 **1-sub-Gaussian**（$\tau=1$ 的次高斯）。字面意思是，对任意 $\tau\ge 0$，

$$
P\left(X\ge \tau\right)\le e^{-\tau^2/2}.
$$

右边是一条**高斯尾概率**：均值为 0、方差为 1 的高斯随机变量，其尾概率正好是这个量级。所以「1-sub-Gaussian」= **尾部不比标准高斯更重**。

两个配套事实：

- **有界 $\Rightarrow$ 次高斯**：若 $X\in[a,b]$，则 $X$ 是 $\sigma$-sub-Gaussian，$\sigma=\dfrac{b-a}{2}$。所以像「点击/不点击」这种 $[0,1]$ 奖励自动满足假设。
- 假设不是免费的：讲义用一对臂做对比——Arm 1 是 $\mu_1=0.5$ 的公平硬币；Arm 2 以 $10^{-9}$ 的概率给出 $10^9$、否则给 0，均值 $\mu_2=1$。Arm 2 的均值更大，但它的尾巴极重，**不满足次高斯假设**，经验均值会非常不稳定。

### 5.2 算法

ETC 的思路和 **A/B testing** 完全一致，分两个阶段。

```text
输入：m（每个臂要探索的次数）
共 k 个臂，共 n 轮

阶段 i（Exploration，探索）：t = 1 … mk
    A_t = (t mod k) + 1          # 轮转，每个臂各被拉 m 次

阶段 ii（Commit，利用）：t = mk+1 … n
    A_t = argmax_i  μ̂_i(mk)      # 锁定探索期经验均值最高的臂
```

其中经验均值的定义是

$$
\hat\mu_i(t)=\frac{\sum_{s=1}^{t}\mathbf 1[A_s=i]\,X_s}{\sum_{s=1}^{t}\mathbf 1[A_s=i]}
=\frac{\text{臂 } i \text{ 到第 } t \text{ 轮为止的总奖励}}{T_i(t)} .
$$

分母就是被选次数 $T_i(t)$，所以这就是「**到目前为止的平均奖励**」，也叫 empirical mean reward。

> **一个容易忽略的细节**：讲义写的是 $A_t=(t\bmod k)+1$，而 $t$ 从 1 开始，所以第一个动作是 $2$ 号臂，序列是 $2,3,\dots,k,1,2,\dots$。若想从 1 号臂开始，等价写法是 $\big((t-1)\bmod k\big)+1$。两种都对，只是起点不同——照抄公式时别以为写错了。

### 5.3 例子：$k=5$，$m=3$

探索期共 $mk=15$ 轮，动作序列是 3 个完整轮转：

$$
A_t=\left(2,3,4,5,1,\;2,3,4,5,1,\;2,3,4,5,1,\;\underline{\phantom{1}}\right)
$$

最后那个下划线处就是 **commit phase starts here**（$t=16$）。

如果探索期的经验均值显示 2 号臂最好，那么之后所有轮次都选 2：

$$
A_t=\left(2,3,4,5,1,\;\dots,\;2,3,4,5,1,\;2,2,2,2,\dots,2\right)
$$

### 5.4 补充：ETC 到底能做到多好（讲义未讲）

讲义停在「算法给出」这一层，没有再给界。为了把这条线接上，补一句必要的背景（**以下是补充，不是讲义内容**）：

- 探索期固定花掉 $mk$ 轮，这部分 regret 最多约 $mk\cdot\max_a\Delta_a$，随 $m$ 线性增长；
- commit 阶段一旦选错臂（以某个**不随 $n$ 衰减**的常数概率发生），之后每轮都在付 $\Delta$，于是这部分 regret 是 $n$ 的线性项。

两害相权，取 $m\approx n^{2/3}$ 可把总量压到 $O(n^{2/3})$——比线性好，**但达不到 $O(\log n)$**。原因是 ETC 的探索是「不看数据、事先定额」的，探索完就再也不改主意。要拿到 log 级 regret，必须让探索量随观测动态缩减，这正是后面 UCB / Thompson Sampling 的动机。

> 这一条也解释了第 4.4 节那条概率条件为什么难：对数 regret 要求「第 $t$ 轮还犯错的概率 $\lesssim 1/t$」，而 ETC 在 commit 阶段的犯错概率是常数。**ETC 满足第 5.2 节的形式，但不满足 4.4 节的条件**——它是理解问题的好起点，不是一个好算法。

---

## 6. 公式速查

| 名称 | 公式 |
|---|---|
| 累积奖励 | $S_n=\sum_{t=1}^{n}X_t$ |
| 臂均值 | $\mu_a=\mathbb E[X_t\mid A_t=a]$ |
| 离散情形 | $\mu_a=\sum_\ell P(\text{reward}=\ell\mid a)\cdot\ell$ |
| 最优臂 / 最优均值 | $a^*=\arg\max_a\mu_a$，$\mu^*=\max_a\mu_a$ |
| 次优间隙 | $\Delta_a=\mu^*-\mu_a$，$\Delta_{a^*}=0$ |
| Regret（定义） | $R_n(\pi)=n\mu^*-\mathbb E\left[\sum_{t=1}^{n}X_t\right]$ |
| Regret（按轮） | $R_n=\sum_{t=1}^{n}\Delta_{A_t}$ |
| 动作计数 | $T_a(t)=\sum_{s=1}^{t}\mathbf 1[A_s=a]$ |
| **Regret 分解** | $R_n=\sum_{a\in\mathcal A}\Delta_a\,\mathbb E[T_a(n)]$ |
| 对数 regret | $R_n\le C\log n\iff R_n=O(\log n)$ |
| 错误率等价形式 | $P(\text{第 }t\text{ 轮选错})\lesssim 1/t$ |
| 次高斯尾 | $P(X\ge\tau)\le e^{-\tau^2/2}$ |
| 有界 $\Rightarrow$ 次高斯 | $X\in[a,b]\Rightarrow\sigma=\frac{b-a}{2}$ |
| 经验均值 | $\hat\mu_i(t)=\dfrac{\sum_{s\le t}\mathbf 1[A_s=i]X_s}{T_i(t)}$ |

---

## 7. 英文术语对照

| English | 中文 | 备注 |
|---|---|---|
| multi-armed bandit | 多臂老虎机 | 名字来自赌场的老虎机（one-armed bandit） |
| arm / action | 臂 / 动作 | 讲义里混用 |
| learner | 学习器 | 与 environment 相对 |
| environment | 环境 | 有时指「算法设计者」 |
| horizon | 时间跨度 / 总轮数 | 就是 $n$ |
| cumulative reward | 累积奖励 | $\sum X_t$ |
| expected value / mean | 期望 / 均值 | utility 的默认选择 |
| utility (function) | 效用（函数） | 把分布压成一个数 |
| exploration | 探索 | 为了获取信息 |
| exploitation | 利用 | 为了拿奖励 |
| exploration–exploitation dilemma | 探索–利用两难 | 全篇的核心矛盾 |
| stochastic stationary bandit | 随机平稳 bandit | 经典设定，分布不随轮次变 |
| optimal arm / best arm | 最优臂 | $a^*$ |
| sub-optimal action | 次优动作 | |
| sub-optimality gap | 次优间隙 | $\Delta_a=\mu^*-\mu_a$ |
| regret | 遗憾 / 悔值 | 相对 hindsight 最优的损失 |
| logarithmic regret | 对数级遗憾 | $O(\log n)$ |
| regret decomposition (formula) | 遗憾分解（公式） | 按臂而非按轮求和 |
| indicator function | 指示函数 | $\mathbf 1[E]$ |
| action count | 动作计数 | $T_a(t)$ |
| empirical mean / average reward | 经验均值 / 平均奖励 | $\hat\mu_i(t)$ |
| round-robin | 轮转（轮流） | ETC 探索期的取法 |
| explore-then-commit (ETC) | 先探索后承诺 | 类 A/B testing |
| commit phase | 承诺 / 利用阶段 | $t>mk$ |
| sub-Gaussian | 次高斯 | 尾部不比高斯重 |
| tail probability | 尾概率 | $P(X\ge\tau)$ |
| A/B testing | A/B 测试 | ETC 的工业对应物 |

---

## 8. 容易踩的五个坑

1. **regret 的基准是「事后最优的固定臂」**，不是最优自适应策略。$n\mu^*$ 里每轮都用同一个 $a^*$。
2. **$T_a(t)$ 里的 $t$ 是「到第 $t$ 轮为止」**，而 $T_a(n)$ 才是全程计数；分解公式里必须用 $n$。
3. **$\mathbb E[X_t]\ne\mu_{A_t}$**，而是 $\mathbb E[X_t]=\mathbb E[\mu_{A_t}]$——外面还有一层对 $A_t$ 的期望，因为 $A_t$ 是随机的。直接写等号就丢了「算法本身有随机性」这件事。
4. **「log regret」不等于「只错 log n 次」**。它说的是期望遗憾的量级；错误次数本身仍是随机的，只是期望约为 $\ln n$。
5. **ETC 不满足 log regret 的条件**。它的探索预算是常数 $mk$、commit 阶段犯错概率是常数；要 log 级必须让探索随数据自适应。

---

## 9. 一页纸记忆版

```text
设定：k 个臂，n 轮，每轮只看到被选中臂的奖励 —— 不选就不知道
矛盾：不试不知道，试错要付费
目标：max E[ΣXt]（默认效用是期望，但不是唯一选择）
差距：Δa = μ* − μa，最优臂的 Δ = 0
损失：Rn = n·μ* − E[ΣXt] = Σ Δ_{At} = Σ_a Δa·E[Ta(n)]
好算法：Rn = O(log n)  ⟺  P(第 t 轮选错) ≲ 1/t
ETC：前 mk 轮轮转探索 → 之后锁定 argmax μ̂i(mk)
     ⟹ 简单、像 A/B testing，但只能到 O(n^{2/3})，达不到 log n
下一步：让探索量随数据自适应（UCB / Thompson）—— 这才是 log regret 的来源
```

> 整份讲义真正的收获不是某个公式，而是**regret 这个记账方式**：它把「在线决策做得好不好」变成了一个可加、可分解、能和算法结构对上的量。一旦写成 $\sum_a \Delta_a\mathbb E[T_a(n)]$，「算法设计」就变成了「怎么分配每个臂的试验次数」。

---

## 10. 手稿原页

十页手写讲义的完整扫描，按原顺序排列。正文里提到「原页 $N$」时，指的就是这一节的第 $N$ 张。

**原页 1 · 博弈设定与 regret 的第一次出现**

![Lecture 3b 第 1 页：learner 与 environment 的序列博弈，horizon 与 regret 的定义](/images/multi-armed-bandits-intro/p01.jpg)

**原页 2 · 探索–利用两难；MAB 与 RL 的分界**

![Lecture 3b 第 2 页：exploration–exploitation dilemma，以及 MAB 是 RL 特例](/images/multi-armed-bandits-intro/p02.jpg)

**原页 3 · 随机平稳 bandit 与学习目标（效用函数）**

![Lecture 3b 第 3 页：stochastic stationary bandits，累积奖励与效用函数的选择](/images/multi-armed-bandits-intro/p03.jpg)

**原页 4 · 伯努利例子；均值、最优臂与最优均值**

![Lecture 3b 第 4 页：广告点击的伯努利模型，μa 的定义与 a*、μ*](/images/multi-armed-bandits-intro/p04.jpg)

**原页 5 · regret 定义与三种等价写法**

![Lecture 3b 第 5 页：Rn(π) 的三种写法与对数 regret](/images/multi-armed-bandits-intro/p05.jpg)

**原页 6 · 对数 regret 的概率含义；指示函数与动作计数**

![Lecture 3b 第 6 页：1/t 概率条件、指示函数与 Ta(t) 的定义](/images/multi-armed-bandits-intro/p06.jpg)

**原页 7 · 次优间隙与 Regret Decomposition Formula**

![Lecture 3b 第 7 页：Δa=μ*−μa 与按臂求和的 regret 分解](/images/multi-armed-bandits-intro/p07.jpg)

**原页 8 · 1-sub-Gaussian、尾概率与 ETC 的两阶段**

![Lecture 3b 第 8 页：次高斯尾概率、有界与次高斯的关系、ETC 的动机](/images/multi-armed-bandits-intro/p08.jpg)

**原页 9 · ETC 伪代码与经验均值**

![Lecture 3b 第 9 页：Explore-Then-Commit 算法与 μ̂i(t) 的定义](/images/multi-armed-bandits-intro/p09.jpg)

**原页 10 · k=5、m=3 的动作序列**

![Lecture 3b 第 10 页：探索期的轮转序列与 commit 阶段的切换](/images/multi-armed-bandits-intro/p10.jpg)

