---
title: "假设检验与参数估计：两份讲义的中英对照精读笔记"
description: "从假设检验、ML/MAP/Bayes 到参数估计、MLE 与置信区间，逐条解析第一份讲义文末的三条总结公式，并补上手稿中的英文术语。"
date: 2026-10-23
tags: ["假设检验", "参数估计", "贝叶斯决策", "MLE", "学习笔记"]
featured: true
lang: "zh-CN"
---

> **材料一**：16 页手写讲义，主题为 *Hypothesis Testing / Classification*（假设检验与分类）。  
> **材料二**：14 页手写讲义，主题为 *Estimation*（参数估计），开头复习了材料一的假设检验，然后讲 p 值、点估计、MLE、贝叶斯估计与置信区间。  
> **本笔记重点**：材料一第 15 页文末 **“In summary”** 的三条结论，以及支撑它们的关键公式。原文是三条文字结论；下面会把它们写成公式，并逐项解释每个因子的来历和直觉。

**阅读路线**

- 想先看“三条总结”的完整解析：直接跳到 **2.8 节**。
- 想系统梳理假设检验：读 **第 1–2 节**。
- 想学 p 值、MLE、MAP、置信区间：读 **第 3 节**。
- 想理解两份讲义如何接在一起：读 **第 4 节**。
- 想练课堂英语、术语和公式读法：读 **1.1–1.5 节**。
- 考前快速复习：看 **第 5 节公式速查** 和 **第 7 节一页纸记忆版**。

---

## 0. 先给结论：两份讲义其实在讲同一件事

两份讲义看起来是两个主题，实际上共用同一个概率模型：

```text
未知量 θ  →  条件分布 f_X(x|θ)  →  观测 X = x  →  做一个动作
                                              ├─ 假设检验：在 H0 / H1 中选一个（决策）
                                              └─ 参数估计：给出 θ 的一个数值（估计）
```

- **材料一**：θ 只取两个（或有限个）假设，动作是“判 H0 / 判 H1”，关心的是**错误率和代价**。
- **材料二**：θ 是连续参数，动作是“给出估计值 \(\hat\theta\)”，关心的是**偏差、方差、均方误差和置信区间**。
- 两份讲义最后都落到同一个贝叶斯模板：

$$
\text{后验} \;\propto\; \text{似然} \times \text{先验}.
$$

材料一文末的三条总结，本质上是在说：

$$
\boxed{
\text{均匀代价下的 Bayes 检验}
\;\equiv\;
\text{MAP 检验}
\;\equiv\;
\text{最小错误率检验}
}
$$

也就是：**当两类错误同样昂贵、正确决策不花钱时，按后验概率最大的假设去判，就是最优策略。**

---

## 1. 统一符号表

| 符号 | 含义 | 备注 |
|---|---|---|
| \(\theta\) | 未知参数 / 真实状态 | 材料一中是离散假设，材料二中是连续参数 |
| \(\Theta\) | 参数空间 | \(\theta\in\Theta\) |
| \(H_0,H_1\) | 两个假设 | \(H_0\) 常称“原假设”，\(H_1\) 常称“备择假设” |
| \(X,x\) | 观测随机变量 / 观测值 | \(X\) 可以是向量 |
| \(f_X(x\mid H_i)\) | 在假设 \(H_i\) 下 \(X\) 的条件密度 | 材料一中称为 likelihood |
| \(P_0,P_1\) | 先验概率 \(P(H_0),P(H_1)\) | \(P_0+P_1=1\) |
| \(L(x)\) | **似然比** \(\dfrac{f_X(x\mid H_1)}{f_X(x\mid H_0)}\) | 材料一专用；注意与材料二的似然函数区分 |
| \(P_{FA}\) | 虚警率 \(P(\text{判 }H_1\mid H_0)\) | false alarm，第一类错误 |
| \(P_M\) | 漏检率 \(P(\text{判 }H_0\mid H_1)\) | miss，第二类错误 |
| \(P_D\) | 检测率 \(P(\text{判 }H_1\mid H_1)=1-P_M\) | detection / sensitivity / recall |
| \(C_{ij}\) | 判 \(H_i\)、实际 \(H_j\) 时的代价 | \(i,j\in\{0,1\}\) |
| \(C_{FA}\) | 虚警代价，等于 \(C_{10}\) | 常与 \(C_M\) 一起用 |
| \(C_M\) | 漏检代价，等于 \(C_{01}\) | 常与 \(C_{FA}\) 一起用 |
| \(\hat\theta\) | \(\theta\) 的估计量 | 材料二 |
| \(L(\theta;\vec x)\) | **似然函数** \(\prod_i f_{X_i}(x_i\mid\theta)\) | 材料二专用；与材料一的 \(L(x)\) 含义不同 |

> **符号警告**：材料一的 \(L(x)\) 是“似然比”，材料二的 \(L(\theta;\vec x)\) 是“似然函数”。两者都写成 \(L\)，但完全不是同一个东西。跨文档比较时，本笔记会把似然比记作 \(\Lambda(x)\)，以免混淆。

### 1.1 假设检验：符号、公式与手稿英文

> 外教上课时说的是 **false alarm probability**，不是“虚警率”；说的是 **likelihood ratio**，不是“似然比”。下面把符号、公式名和手稿/课堂原话放在一起，方便边看公式边跟上英文。

| 符号/公式 | 英文（手稿/课堂常用） | 中文 |
|---|---|---|
| \(\theta\) | hidden (unknown) parameter | 隐藏/未知参数 |
| \(f_X(x\mid\theta)\) | parametric model; conditional probability density function (PDF); likelihood | 参数化模型；条件概率密度；似然 |
| \(X\) | observations / measurement / data | 观测/测量/数据 |
| decision rule | decision rule | 决策规则 |
| \(H_0,H_1\) | hypotheses | 假设 |
| \(P_0,P_1\) | prior probabilities | 先验概率 |
| \(P_{FA}\) | false alarm probability; type-1 error rate; false positive rate | 虚警率；第一类错误率；假阳性率 |
| \(P_M\) | miss probability; type-2 error rate; false negative rate | 漏检率；第二类错误率；假阴性率 |
| \(P_D\) | detection probability; true positive rate; sensitivity; recall; power of the test | 检测率；真阳性率；灵敏度；召回率；检验功效 |
| specificity | specificity; true negative rate | 特异度；真阴性率 |
| precision | precision; positive predictive value (PPV) | 精确率；阳性预测值 |
| \(C_{FA}\) | cost of false alarm | 虚警代价 |
| \(C_M\) | cost of a miss | 漏检代价 |
| \(C_{ij}\) | cost of deciding \(H_i\) when in fact \(H_j\) was true | 判 \(H_i\)、实际 \(H_j\) 为真时的代价 |
| \(L(x)\) | likelihood ratio function | 似然比函数 |
| \(P(\text{error})\) | probability of error | 错误概率 |
| \(E[\text{cost}]\) | expected cost; Bayes risk | 期望代价；贝叶斯风险 |
| uniform cost | uniform cost | 均匀代价 |
| ML | Maximum Likelihood | 最大似然 |
| MAP | Maximum A Posteriori Probability | 最大后验概率 |
| Bayes decision rule | Bayesian Decision Rule; Bayes Test | 贝叶斯判决规则/贝叶斯检验 |
| \(\tau\) | threshold | 阈值 |
| \(T(x)\) | test statistic | 检验统计量 |
| \(\alpha\) | false alarm probability | 虚警率（检验的显著性水平） |

### 1.2 参数估计：符号、公式与手稿英文

| 符号/公式 | 英文（手稿/课堂常用） | 中文 |
|---|---|---|
| \(\hat\theta\) | estimator / estimate | 估计量/估计值 |
| bias | bias of the estimation | 估计偏差 |
| standard error | standard error | 标准误 |
| consistency | consistent estimator | 一致估计量 |
| \(L(\theta;\vec x)\) | likelihood function | 似然函数 |
| \(\ell(\theta;\vec x)\) | log-likelihood function | 对数似然函数 |
| MLE | Maximum Likelihood Estimation / Estimator | 最大似然估计/估计量 |
| posterior | posterior distribution | 后验分布 |
| MAP estimator | Maximum A Posteriori Probability Estimator | 最大后验估计 |
| MMSE | Minimum Mean-Squared Error Estimator | 最小均方误差估计 |
| MAE | Minimum Absolute Error Estimation | 最小绝对误差估计 |
| \(S\) | sufficient statistic; total number of Heads | 充分统计量；正面总数 |
| \(\bar S\) | sample average; fraction of Heads | 样本均值；正面比例 |
| Hoeffding inequality | Hoeffding Inequality | 霍夫丁不等式 |
| confidence interval | confidence interval | 置信区间 |
| p-value | p-value | p 值 |
| \(\epsilon\) | interval half-width / accuracy | 区间半宽/精度 |
| \(\delta\) | tail probability (per side) | 单侧尾部概率 |

### 1.3 公式英文名速查

| 公式 | 英文名 | 中文 |
|---|---|---|
| \(P(\text{error})=P_0P_{FA}+P_1P_M\) | Probability of error | 错误概率 |
| \(E[\text{cost}]=P_0P_{FA}C_{FA}+P_1P_MC_M\) | Expected cost; Bayes risk | 期望代价；贝叶斯风险 |
| \(\Lambda(x)\gtrless \tau\) | Likelihood ratio test; Bayes decision rule | 似然比检验；贝叶斯判决规则 |
| \(\Lambda(x)\gtrless P_0/P_1\) | MAP decision rule | 最大后验判决规则 |
| \(\Lambda(x)\gtrless 1\) | ML decision rule | 最大似然判决规则 |
| \(E[\text{cost}]=P(\text{error})\) | Expected cost under uniform cost | 均匀代价下的期望代价 |
| \(\hat\theta_{ML}\) | Maximum Likelihood Estimator (MLE) | 最大似然估计 |
| \(\hat\theta_{MAP}\) | Maximum A Posteriori Probability Estimator | 最大后验估计 |
| \(\hat\theta_{MMSE}\) | Minimum Mean-Squared Error Estimator | 最小均方误差估计 |
| \(\hat\theta_{MAE}\) | Minimum Absolute Error Estimator | 最小绝对误差估计 |
| \(P(\lvert\bar S-\theta\rvert>\epsilon)\le 2e^{-2n\epsilon^2}\) | Hoeffding Inequality | 霍夫丁不等式 |
| \(\theta\in[\bar S-\epsilon,\bar S+\epsilon]\) | Confidence interval | 置信区间 |

### 1.4 课堂高频英文表达

| 英文原话/常用句 | 中文 | 出现场景 |
|---|---|---|
| Let \(\theta\) represent ... | 令 \(\theta\) 表示…… | 建模 |
| Assume that ... | 假设…… | 建模 |
| We observe \(X=x\) ... | 我们观测到…… | 数据 |
| We have to decide which of the two hypotheses hold. | 我们要判断哪个假设成立。 | 决策 |
| The decision rule is given by ... | 判决规则为…… | 规则 |
| This is equivalent to ... | 这等价于…… | 推导 |
| The threshold is calculated by finding the \(x\) value for which \(L(x)=1\). | 阈值通过令 \(L(x)=1\) 求得。 | ML 阈值 |
| By applying Bayes' Rule ... | 应用贝叶斯公式…… | MAP |
| Under uniform cost ... | 在均匀代价下…… | 总结 |
| This proves that ... | 这证明了…… | 证明 |
| In summary ... | 总结…… | 总结 |
| Minimizing \(E[\text{cost}]\) is equivalent to minimizing ... | 最小化期望代价等价于最小化…… | 风险 |
| The ML estimate is ... | 最大似然估计是…… | MLE |
| MAP estimator looks at the mode ... | MAP 估计看众数…… | 贝叶斯估计 |
| We can show that ... | 我们可以证明…… | 推导 |
| With probability at least ... | 以至少……的概率 | 置信区间 |
| As \(n\to\infty\) ... | 当 \(n\) 趋于无穷…… | 渐近性 |
| i.e. | 即 | 通用 |
| aka | 又称 | 通用 |
| w.r.t. | 关于 | 求导 |

### 1.5 公式怎么读（课堂口语）

| 公式/符号 | 课堂口语读法 | 中文 |
|---|---|---|
| \(\hat\theta\) | “theta hat” | \(\theta\) 的估计 |
| \(\bar S\) | “S bar” | 样本均值 |
| \(P_{FA}\) | “P F A” / “probability of false alarm” | 虚警率 |
| \(P_M\) | “P M” / “probability of miss” | 漏检率 |
| \(P_D\) | “P D” / “probability of detection” | 检测率 |
| \(P(H_i\mid x)\) | “probability of H i given x” | 给定 \(x\) 时 \(H_i\) 的概率 |
| \(f_X(x\mid H_i)\) | “density of X given H i” | 给定 \(H_i\) 时 \(X\) 的密度 |
| \(\Lambda(x)\) | “likelihood ratio” / “lambda of x” | 似然比 |
| \(E[\text{cost}]\) | “expected cost” | 期望代价 |
| \(\tau\) | “tau” | 阈值 |
| \(n\to\infty\) | “as n goes to infinity” | \(n\) 趋于无穷 |
| \(\xrightarrow{p}\) | “converges in probability” | 依概率收敛 |
| \(\xrightarrow{d}\) | “converges in distribution” | 依分布收敛 |
| iid | “i i d” / “independent and identically distributed” | 独立同分布 |
| w.r.t. | “with respect to” | 关于 |
| i.e. | “that is” | 即 |
| e.g. | “for example” | 例如 |
| aka | “also known as” | 又称 |

> **上课用法**：听到 “likelihood ratio” → 手上写 \(\Lambda(x)=\dfrac{f_X(x\mid H_1)}{f_X(x\mid H_0)}\)；听到 “uniform cost” → 写 \(C_{00}=C_{11}=0,\ C_{10}=C_{01}=1\)；听到 “under uniform cost” → 立刻想到 “Bayes = MAP，且 \(E[\text{cost}]=P(\text{error})\)”。这样耳朵听到英文，手上就能同步写出公式。

---

## 2. 材料一：假设检验与分类（Hypothesis Testing / Classification）

### 2.1 问题设定：从“隐藏参数”到“决策”

材料一第 1 页给出整张图：

$$
\theta \;\longrightarrow\; f_X(x\mid\theta) \;\longrightarrow\; X \;\longrightarrow\; \text{Hypothesis Testing} \;\longrightarrow\; H_0 \text{ 或 } H_1.
$$

- \(\theta\) 是隐藏的、未知的参数；我们想推断它。
- \(f_X(x\mid\theta)\) 是**假设已知**的参数化模型，它给出观测 \(X\) 与 \(\theta\) 之间的统计关系。
- \(X\) 是观测/测量/数据，可以是向量。
- “Hypothesis Testing”这个框就是我们要设计的**决策规则（decision rule）**。

几个术语：

- **二值检验（binary testing problem）**：只有 \(H_0,H_1\) 两个假设。
- **M 元检验（M-ary hypothesis testing problem）**：有 \(H_0,H_1,\dots,H_{M-1}\) 多个假设。
- **简单假设（simple hypothesis）**：假设集合只含一个元素，例如 \(H_0:\theta=\theta_0\)。
- **复合假设（composite hypothesis）**：假设集合含多个元素，例如 \(H_0:\theta\le 74\)。

**温度例子**（第 1 页）：

$$
\Theta=\{50,51,\dots,99\},
$$

$$
H_0:\theta\le 74^\circ\text{F},\qquad H_1:\theta>75^\circ\text{F}.
$$

观测模型是

$$
X=\theta+\varepsilon,
$$

其中 \(\varepsilon\) 是随机测量误差，假设其分布已知（例如零均值高斯）。这个例子说明：**假设可以是一个参数区间，而不一定是一个单点。**

**三个应用**（第 2 页）：

1. **数字通信**：\(X=\theta+\text{Noise}\)，根据接收信号判断发送的是 0 还是 1。
2. **医学诊断**：\(X\) 是 PCR/荧光信号，判断病人是否感染。
3. **雷达/激光雷达**：\(X\) 是传感器测量，判断有没有目标。

这三个场景的共同结构都是：**观测有噪声，必须在两个假设之间做选择。**

---

### 2.2 四格表：两类错误

第 3 页的四格表是整份讲义的语言基础：

| 真实情况 \ 我们的决策 | 判 \(H_0\) | 判 \(H_1\) |
|---|---|---|
| \(H_0\) 为真 | 真阴性（true negative） | **第一类错误 / 虚警**（type-1 error / false alarm），概率 \(P_{FA}\) |
| \(H_1\) 为真 | **第二类错误 / 漏检**（type-2 error / miss），概率 \(P_M\) | 真阳性（true positive / detection） |

对应的条件概率：

$$
P_M=P(\text{判 }H_0\mid H_1\text{ 为真}),
$$

$$
P_{FA}=P(\text{判 }H_1\mid H_0\text{ 为真}).
$$

注意这两个概率都是**条件概率**，不是联合概率。它们的分母分别是“真实为 \(H_1\)”和“真实为 \(H_0\)”。

---

### 2.3 评价指标（Performance Metrics）：名字很多，别混

第 4 页列出了一串指标。把它们按“分母是什么”分类，就不会混：

| 指标 | 定义 | 直觉 |
|---|---|---|
| 漏检率 \(P_M\)（miss probability） | \(P(\text{判 }H_0\mid H_1)\) | 有目标却漏掉 |
| 虚警率 \(P_{FA}\)（false alarm probability） | \(P(\text{判 }H_1\mid H_0)\) | 没目标却报警 |
| 特异度 specificity（true negative rate） | \(P(\text{判 }H_0\mid H_0)=1-P_{FA}\) | 没病时判“没病”的能力 |
| 灵敏度 / 召回率 / 检测率 \(P_D\)（sensitivity / recall / detection） | \(P(\text{判 }H_1\mid H_1)=1-P_M\) | 有病时判“有病”的能力 |
| 精确率 precision / PPV（positive predictive value） | \(P(H_1\text{ 为真}\mid \text{判 }H_1)\) | 报警的人里，真有多少有病 |

精确率用贝叶斯公式展开：

$$
P(H_1\mid \text{判 }H_1)
=
\frac{P(\text{判 }H_1\mid H_1)P(H_1)}
{P(\text{判 }H_1\mid H_1)P(H_1)+P(\text{判 }H_1\mid H_0)P(H_0)}
=
\frac{P_D P_1}{P_D P_1+P_{FA}P_0}.
$$

这条公式很重要：**精确率不仅取决于检测器本身（\(P_D,P_{FA}\)），还取决于先验 \(P_0,P_1\)。** 即使 \(P_D\) 很高，如果疾病在人群中很罕见（\(P_1\) 很小），精确率也可能很低。这是“基础率谬误”的数学版本。

---

### 2.4 从错误概率到贝叶斯风险

#### 2.4.1 只有两类错误代价的情形

第 5 页先假设正确决策不花钱，只给两类错误赋代价（false alarm / miss）：

$$
C_{FA}:\ \text{cost of false alarm},\qquad C_M:\ \text{cost of a miss}.
$$

由全概率公式：

**错误概率（Probability of Error）**

$$
P(\text{error})
=
P(\text{error}\mid H_0)P_0+P(\text{error}\mid H_1)P_1
=
P_{FA}P_0+P_MP_1.
$$

**期望代价（Expected Cost / Bayes Risk）**

$$
E[\text{cost}]
=
P_0P_{FA}C_{FA}+P_1P_MC_M.
$$

如果 \(C_{FA}=C_M\)，那么

$$
E[\text{cost}]
=
C_{FA}\big(P_0P_{FA}+P_1P_M\big)
=
C_{FA}\,P(\text{error}).
$$

于是“最小化期望代价”就等价于“最小化错误概率”。这是后面“均匀代价”结论的伏笔。

#### 2.4.2 完整的四代价模型

第 13 页把模型推广到四种情况。定义

**代价矩阵（Cost Matrix）**

$$
C_{ij}=\text{cost of deciding }H_i\text{ when in fact }H_j\text{ was true}.
$$

具体是：

| 代价 | 含义 |
|---|---|
| \(C_{00}\) | 判 \(H_0\)，实际 \(H_0\)（正确） |
| \(C_{01}\) | 判 \(H_0\)，实际 \(H_1\)（漏检） |
| \(C_{10}\) | 判 \(H_1\)，实际 \(H_0\)（虚警） |
| \(C_{11}\) | 判 \(H_1\)，实际 \(H_1\)（正确） |

期望代价可以写成

$$
\begin{aligned}
E[C]
&=
P_0\big[(1-P_{FA})C_{00}+P_{FA}C_{10}\big]
+
P_1\big[P_MC_{01}+(1-P_M)C_{11}\big] \\
&=
P_0C_{00}+P_1C_{11}
+
P_0P_{FA}(C_{10}-C_{00})
+
P_1P_M(C_{01}-C_{11}).
\end{aligned}
$$

前两项 \(P_0C_{00}+P_1C_{11}\) 是“正确决策的 baseline 代价”，**不依赖决策区域 \(R\)**。真正能通过设计决策规则改变的是后两项：

$$
P_0P_{FA}(C_{10}-C_{00})+P_1P_M(C_{01}-C_{11}).
$$

因此，最优决策只需要最小化这两项。注意这里出现的是**增量代价** \(C_{10}-C_{00}\) 和 \(C_{01}-C_{11}\)，而不是 \(C_{10}\) 和 \(C_{01}\) 本身。

---

### 2.5 三种决策规则：ML、MAP、Bayes

材料一第 7–14 页逐步引出三种规则。先把它们放在一张表里：

| 规则 | 优化的对象 | 判决式 | 退化关系 |
|---|---|---|---|
| **ML**（最大似然） | \(\max_i f_X(x\mid H_i)\) | \(\Lambda(x)\gtrless 1\) | — |
| **MAP**（最大后验） | \(\max_i P(H_i\mid x)\) | \(\Lambda(x)\gtrless \dfrac{P_0}{P_1}\) | 先验相等 \(P_0=P_1\) 时，MAP = ML |
| **Bayes**（最小期望代价） | \(\min E[C]\) | \(\Lambda(x)\gtrless \dfrac{C_{10}-C_{00}}{C_{01}-C_{11}}\cdot\dfrac{P_0}{P_1}\) | 均匀代价时，Bayes = MAP |

其中

$$
\Lambda(x)=\frac{f_X(x\mid H_1)}{f_X(x\mid H_0)}
$$

是**似然比**（材料一记作 \(L(x)\)）。

三者的关系可以记成：

$$
\text{Bayes}
\;\supset\;
\text{MAP}
\;\supset\;
\text{ML}.
$$

- **Bayes** 最一般：它把“先验”和“代价”都考虑进去。
- **MAP** 是 Bayes 在“正确决策零代价、两类错误等代价”下的特例。
- **ML** 是 MAP 在“先验相等”下的特例。

> **术语提醒**：这里的“Bayes 检验 / Bayes 规则”指的是**最小化期望代价的决策规则**，不是“贝叶斯定理”本身。贝叶斯定理只是用来把后验 \(P(H_i\mid x)\) 写成“先验 × 似然”的形式。

> 注意：这里的“\(\supset\)”不是严格集合包含，而是“Bayes 在特定条件下退化为 MAP，MAP 在特定条件下退化为 ML”的意思。

![材料一第 14 页：ML / MAP / Bayes 三种决策规则的对照](/images/hypothesis-testing-and-estimation/doc1_p14_bayes_rule.png)

---

### 2.6 高斯位置例子：阈值长什么样

第 6–12 页用一个一维定位问题把公式落地。

**模型**：

$$
X=\theta+\varepsilon,\qquad \varepsilon\sim\mathcal N(0,\sigma^2),
$$

$$
H_0:\theta=\theta_0,\qquad H_1:\theta=\theta_1,\qquad \theta_1>\theta_0.
$$

于是

$$
X\mid H_0\sim\mathcal N(\theta_0,\sigma^2),\qquad
X\mid H_1\sim\mathcal N(\theta_1,\sigma^2).
$$

**似然比（Likelihood Ratio Function）**：

$$
\Lambda(x)
=
\frac{
\frac{1}{\sqrt{2\pi\sigma^2}}
\exp\left(-\frac{(x-\theta_1)^2}{2\sigma^2}\right)
}{
\frac{1}{\sqrt{2\pi\sigma^2}}
\exp\left(-\frac{(x-\theta_0)^2}{2\sigma^2}\right)
}
=
\exp\left(
-\frac{(x-\theta_1)^2-(x-\theta_0)^2}{2\sigma^2}
\right).
$$

**ML 规则（Maximum Likelihood Decision Rule）**：令 \(\Lambda(x)\gtrless 1\)，等价于

$$
(x-\theta_1)^2 \lessgtr (x-\theta_0)^2,
$$

即

$$
x \gtrless \frac{\theta_0+\theta_1}{2}.
$$

所以 ML 的阈值是

$$
\tau_{ML}=\frac{\theta_0+\theta_1}{2},
$$

也就是两个高斯密度的交点。

**MAP 规则（Maximum A Posteriori Decision Rule）**：令 \(\Lambda(x)\gtrless P_0/P_1\)，取对数并化简：

$$
-\frac{(x-\theta_1)^2-(x-\theta_0)^2}{2\sigma^2}
\gtrless
\ln\frac{P_0}{P_1}.
$$

利用

$$
(x-\theta_1)^2-(x-\theta_0)^2
=
-(\theta_1-\theta_0)(2x-\theta_0-\theta_1),
$$

得到

$$
\frac{(\theta_1-\theta_0)(2x-\theta_0-\theta_1)}{2\sigma^2}
\gtrless
\ln\frac{P_0}{P_1}.
$$

最终：

$$
\boxed{
\tau_{MAP}
=
\frac{\theta_0+\theta_1}{2}
+
\frac{\sigma^2}{\theta_1-\theta_0}
\ln\frac{P_0}{P_1}
}
$$

**怎么读这个阈值？**

- 第一项 \(\dfrac{\theta_0+\theta_1}{2}\) 是 ML 阈值，只看数据。
- 第二项是“先验修正”：
  - 若 \(P_0>P_1\)，\(\ln(P_0/P_1)>0\)，阈值右移，更倾向判 \(H_0\)。
  - 若 \(P_0<P_1\)，\(\ln(P_0/P_1)<0\)，阈值左移，更倾向判 \(H_1\)。
  - 若 \(P_0=P_1\)，修正项为 0，MAP 退化为 ML。
- 系数 \(\dfrac{\sigma^2}{\theta_1-\theta_0}\) 可以理解为一种“噪声/信号”的比值：噪声越大、两个假设越接近，先验对阈值的影响越大；反之，数据本身很有区分度时，先验的影响就小。

第 12 页的 Remarks 正是在强调这一点：

- \(P_0=P_1=\frac12\)：\(\tau_{MAP}=\tau_{ML}\)，MAP = ML。
- \(P_0>P_1\)：阈值右移，MAP 更偏向 \(H_0\)。
- \(P_0<P_1\)：阈值左移，MAP 更偏向 \(H_1\)。
- \(\sigma^2/(\theta_1-\theta_0)\) 越大，阈值越依赖先验，越不依赖观测。

---

### 2.7 贝叶斯决策规则的证明（第 16 页）

这部分是理解文末总结的关键。证明的目标是：**最小化期望代价的决策区域 \(R\) 应该取成什么样的形式？**

令 \(R\) 是“判 \(H_1\)”的观测集合，\(R^c\) 是“判 \(H_0\)”的集合。忽略不依赖 \(R\) 的常数项，需要最小化

$$
J(R)
=
P_0(C_{10}-C_{00})\int_R f_X(x\mid H_0)\,dx
+
P_1(C_{01}-C_{11})\int_{R^c} f_X(x\mid H_1)\,dx.
$$

把第二个积分写成“全空间减去 \(R\)”：

$$
J(R)
=
\int_R
\underbrace{
P_0(C_{10}-C_{00})f_X(x\mid H_0)
}_{\text{若把 }x\text{ 判为 }H_1\text{ 的代价密度}}
\,dx
+
\text{常数}
-
\int_R
\underbrace{
P_1(C_{01}-C_{11})f_X(x\mid H_1)
}_{\text{若把 }x\text{ 判为 }H_0\text{ 的代价密度}}
\,dx.
$$

对每个 \(x\) 独立地选择“放进 \(R\)”还是“不放进 \(R\)”：

- 如果“判 \(H_1\)”的代价密度更小，就把 \(x\) 放进 \(R\)；
- 否则不放进 \(R\)。

也就是

$$
P_0(C_{10}-C_{00})f_X(x\mid H_0)
\le
P_1(C_{01}-C_{11})f_X(x\mid H_1)
\;\Longrightarrow\;
\text{判 }H_1.
$$

移项：

$$
\frac{f_X(x\mid H_1)}{f_X(x\mid H_0)}
\ge
\frac{C_{10}-C_{00}}{C_{01}-C_{11}}\cdot\frac{P_0}{P_1}.
$$

这就是一般的贝叶斯判决规则。**它的直观是：在每一个观测点 \(x\) 上，比较“判 H1 的代价”与“判 H0 的代价”，谁小选谁。**

---

### 2.8 文末总结的三个公式：逐条精讲

第 15 页文末的原文是：

> **In summary:**  
> 1. Bayes Test under uniform costs \(\equiv\) MAP Test  
> 2. Bayes Test under uniform costs minimizes prob. of error  
> 3. MAP decision rule minimizes the probability of error

这三条可以看成“一个规则等价 + 一个目标函数等价 + 一个最优性结论”。下面把它们写成公式，并逐项拆解。

| 原文结论 | 对应小节 |
|---|---|
| 1. Bayes under uniform costs \(\equiv\) MAP | 2.8.1 + 2.8.2 |
| 2. Bayes under uniform costs minimizes prob. of error | 2.8.3 |
| 3. MAP minimizes the probability of error | 2.8.3 + 2.8.4 |

![材料一第 15 页：均匀代价与文末总结](/images/hypothesis-testing-and-estimation/doc1_p15_summary.png)

#### 2.8.1 公式一：一般贝叶斯阈值（Bayes Decision Rule）

$$
\boxed{
\Lambda(x)
=
\frac{f_X(x\mid H_1)}{f_X(x\mid H_0)}
\;\underset{H_0}{\overset{H_1}{\gtrless}}\;
\frac{C_{10}-C_{00}}{C_{01}-C_{11}}
\cdot
\frac{P_0}{P_1}
}
$$

逐项解释：

| 因子 | 含义 | 变大时的影响 |
|---|---|---|
| \(\Lambda(x)\) | 数据提供的“H1 相对 H0”的似然比（likelihood ratio） | 越大越支持 \(H_1\) |
| \(C_{10}-C_{00}\) | 虚警的**增量代价（incremental cost of false alarm）**：判 H1 比正确判 H0 多花多少 | 越大，阈值越高，越不敢判 \(H_1\) |
| \(C_{01}-C_{11}\) | 漏检的**增量代价（incremental cost of a miss）**：判 H0 比正确判 H1 多花多少 | 越大，阈值越低，越倾向判 \(H_1\) |
| \(P_0/P_1\) | 先验 odds（prior odds）：H0 相对 H1 的先验可能性 | 越大，阈值越高，越倾向判 \(H_0\) |

> 这里默认 \(C_{10}>C_{00}\)、\(C_{01}>C_{11}\)，即“判错”比“判对”更贵，两个增量代价为正；否则阈值可能为负，最优规则会退化成“总是判某一类”。第 14 页也明确写了“assuming \(C_{01}>C_{11}\)”。

可以记成一句：

$$
\text{判决阈值}
=
\text{代价比}
\times
\text{先验比}.
$$

**几个特例：**

1. **正确决策零代价**：\(C_{00}=C_{11}=0\)。令 \(C_{10}=C_{FA}\)，\(C_{01}=C_M\)，则

$$
\Lambda(x)
\;\underset{H_0}{\overset{H_1}{\gtrless}}\;
\frac{C_{FA}}{C_M}\cdot\frac{P_0}{P_1}.
$$

这正是第 15 页上方红框里的公式：

$$
L(x)
\;\underset{H_0}{\overset{H_1}{\gtrless}}\;
\frac{C_{10}P_0}{C_{01}P_1}
=
\frac{C_{FA}P_0}{C_M P_1}.
$$

2. **均匀代价**：\(C_{00}=C_{11}=0\)，且 \(C_{10}=C_{01}=1\)，则

$$
\Lambda(x)
\;\underset{H_0}{\overset{H_1}{\gtrless}}\;
\frac{P_0}{P_1}.
$$

这就是下一条要讲的“Bayes = MAP”。

3. **先验相等**：\(P_0=P_1\)，则 \(P_0/P_1=1\)。若再叠加均匀代价，就得到 ML 规则 \(\Lambda(x)\gtrless 1\)。

> **易错点**：一般公式里的代价比是 \(\dfrac{C_{10}-C_{00}}{C_{01}-C_{11}}\)，不是 \(\dfrac{C_{10}}{C_{01}}\)。只有当正确决策的代价为零时，二者才相同。这个“增量代价”是第 13–14 页推导的核心。

#### 2.8.2 公式二：均匀代价下 Bayes = MAP（Uniform Cost）

**“均匀代价”（uniform cost）不是“均匀先验”（uniform prior）。** 它的定义是：

$$
C_{00}=C_{11}=0,\qquad C_{10}=C_{01}=1.
$$

也就是：

- 判对不花钱；
- 虚警和漏检各花 1 单位代价；
- 两类错误**同样昂贵**。

代入公式一：

$$
\Lambda(x)
\;\underset{H_0}{\overset{H_1}{\gtrless}}\;
\frac{1-0}{1-0}\cdot\frac{P_0}{P_1}
=
\frac{P_0}{P_1}.
$$

现在用贝叶斯公式把后验写出来：

$$
P(H_i\mid x)=\frac{f_X(x\mid H_i)P_i}{f_X(x)}.
$$

于是后验 odds（posterior odds）是

$$
\frac{P(H_1\mid x)}{P(H_0\mid x)}
=
\frac{f_X(x\mid H_1)P_1}{f_X(x\mid H_0)P_0}
=
\Lambda(x)\cdot\frac{P_1}{P_0}.
$$

比较 \(\Lambda(x)\) 与 \(P_0/P_1\)，等价于比较后验 odds 与 1：

$$
\Lambda(x)\gtrless \frac{P_0}{P_1}
\iff
\frac{P(H_1\mid x)}{P(H_0\mid x)}\gtrless 1
\iff
P(H_1\mid x)\gtrless P(H_0\mid x).
$$

这正是 **MAP（最大后验）规则**：在给定观测 \(x\) 后，选后验概率更大的那个假设。

所以第一条总结成立：

$$
\boxed{
\text{Bayes}\big|_{C_{00}=C_{11}=0,\ C_{10}=C_{01}=1}
\;\equiv\;
\text{MAP}
}
$$

这里的“等价”是指：**对几乎所有的 \(x\)，两种规则给出相同的判决**；在阈值点上可能有 ties（平局），但连续分布下 ties 的概率为零，离散分布下需要约定 tie-breaking。

**为什么不是 ML？**

因为 MAP 还乘了先验：

$$
\text{MAP 比较的是 } f_X(x\mid H_i)P_i,
$$

而 ML 只比较 \(f_X(x\mid H_i)\)。只有当 \(P_0=P_1\) 时，先验因子才抵消，MAP 才退化为 ML。**均匀代价只去掉了代价差异，并没有去掉先验差异。**

#### 2.8.3 公式三：均匀代价下 \(E[\text{cost}]=P(\text{error})\)（Expected Cost = Probability of Error）

这是三条总结里最容易被“看一眼就过”的一条，但它是整个结论的定量核心。

从完整的四代价公式出发：

$$
\begin{aligned}
E[C]
&=
P_0C_{00}+P_1C_{11}
+
P_0P_{FA}(C_{10}-C_{00})
+
P_1P_M(C_{01}-C_{11}).
\end{aligned}
$$

代入均匀代价 \(C_{00}=C_{11}=0\)，\(C_{10}=C_{01}=1\)：

$$
\begin{aligned}
E[C]
&=
P_0\cdot 0+P_1\cdot 0
+
P_0P_{FA}(1-0)
+
P_1P_M(1-0) \\
&=
P_0P_{FA}+P_1P_M.
\end{aligned}
$$

而错误概率由全概率公式：

$$
\begin{aligned}
P(\text{error})
&=
P(\text{error}\mid H_0)P_0
+
P(\text{error}\mid H_1)P_1 \\
&=
P_{FA}P_0+P_MP_1.
\end{aligned}
$$

两式完全相同：

$$
\boxed{
E[\text{cost}]
=
P_0P_{FA}+P_1P_M
=
P(\text{error})
}
$$

这不是近似，也不是“某个特殊数据集上成立”，而是**对任意决策规则都成立的恒等式**。它的含义是：

- 均匀代价下，期望代价的“单位”就是错误概率；
- 最小化 \(E[\text{cost}]\) 与最小化 \(P(\text{error})\) 是同一个优化问题；
- 因此，Bayes 规则（最小化 \(E[\text{cost}]\)）在这个代价设定下，自动就是最小错误率规则。

再结合公式二：

$$
\text{Bayes}\big|_{\text{uniform}}
=
\text{MAP},
$$

就得到：

$$
\boxed{
\text{MAP 规则最小化 }P(\text{error})
}
$$

这就是第三条总结。

![材料一第 16 页：贝叶斯决策规则的证明](/images/hypothesis-testing-and-estimation/doc1_p16_proof.png)

#### 2.8.4 三条结论的逻辑闭环

把三条总结串起来：

$$
\underbrace{\text{Bayes 规则}}_{\min E[C]}
\;\xrightarrow[\text{令 }C_{00}=C_{11}=0,\ C_{10}=C_{01}=1]{\text{均匀代价}}\;
\underbrace{\text{MAP 规则}}_{\max P(H_i\mid x)}
\;\equiv\;
\underbrace{\arg\min_{\delta} P_\delta(\text{error})}_{\text{最小错误率规则}}
$$

逐条对应：

| 原文结论 | 数学含义 | 为什么成立 |
|---|---|---|
| 1. Bayes under uniform costs \(\equiv\) MAP | 判决式都化为 \(\Lambda(x)\gtrless P_0/P_1\) | 均匀代价把代价比变成 1，只剩先验比 |
| 2. Bayes under uniform costs minimizes prob. of error | \(\min E[C]=\min P(\text{error})\) | 均匀代价下 \(E[C]\) 与 \(P(\text{error})\) 是同一个量 |
| 3. MAP minimizes the probability of error | MAP 是 0-1 代价下的 Bayes 最优规则 | 由 1 和 2 直接推出 |

**逻辑顺序很重要**：

1. 先有一般的 Bayes 风险 \(E[C]\)；
2. 把代价设成均匀，得到 Bayes = MAP；
3. 发现此时 \(E[C]\) 恰好等于 \(P(\text{error})\)；
4. 所以 MAP 最小化 \(P(\text{error})\)。

不是“因为 MAP 直观，所以它最优”，而是“因为它在均匀代价下就是 Bayes 规则，而 Bayes 规则最小化期望代价”。

**用英文复述这三条结论（课堂可直接说）**

> 1. “Under uniform cost, the Bayes test reduces to the MAP test.”  
> 2. “Under uniform cost, the expected cost is exactly the probability of error.”  
> 3. “Therefore, the MAP decision rule minimizes the probability of error.”

#### 2.8.5 五个常见误区

1. **把“均匀代价”当成“均匀先验”**  
   均匀代价说的是 \(C_{10}=C_{01}=1\)，不是 \(P_0=P_1\)。前者让 Bayes 退化为 MAP，后者才让 MAP 退化为 ML。

2. **认为 MAP 一定等于 ML**  
   只有当先验相等（或先验为常数）时，MAP 才等于 ML。先验不等时，MAP 会把先验偏置加进去。

3. **认为 Bayes 一定等于 MAP**  
   Bayes 是一般的最小期望代价规则；只有当代价是均匀 0-1 代价时，它才等于 MAP。若虚警和漏检代价不同，Bayes 阈值会偏离 \(P_0/P_1\)。

4. **代价比写成 \(C_{10}/C_{01}\)**  
   一般情形下应是增量比 \(\dfrac{C_{10}-C_{00}}{C_{01}-C_{11}}\)。只有当 \(C_{00}=C_{11}=0\) 时，才简化为 \(C_{10}/C_{01}\)。

5. **把 \(P(\text{error})\) 写成 \(P_{FA}+P_M\)**  
   正确写法是 \(P_0P_{FA}+P_1P_M\)。\(P_{FA}\) 和 \(P_M\) 是条件概率，必须用先验加权。只有 \(P_0=P_1=1/2\) 时，才有 \(P(\text{error})=\frac12(P_{FA}+P_M)\)。

---

### 2.9 材料一的知识线（16 页）

| 页码 | 内容 |
|---|---|
| 1 | 大图景；二值/M 元；简单/复合假设；温度例子 |
| 2 | 条件密度；数字通信、医学诊断、雷达三个应用 |
| 3 | 四格表；第一类/第二类错误 |
| 4 | 特异度、灵敏度、精确率；precision vs recall |
| 5 | 错误概率；两类错误代价；贝叶斯风险 |
| 6 | 高斯位置例子；ML 问题提出 |
| 7 | 阈值形式；ML 决策规则 |
| 8 | 似然比；高斯 ML 推导 |
| 9 | ML 阈值；MAP 规则引入 |
| 10 | MAP；Bayes 规则；ML/MAP 对照表 |
| 11 | 高斯 MAP 阈值；先验修正项 |
| 12 | Remarks：先验、噪声/信号比对阈值的影响 |
| 13 | 完整四代价模型；\(C_{ij}\) |
| 14 | 贝叶斯决策规则；ML/MAP/Bayes 三列对照 |
| 15 | 均匀代价；\(E[C]=P(\text{error})\)；文末三条总结 |
| 16 | 贝叶斯决策规则的证明 |

---

## 3. 材料二：参数估计（Estimation）

材料二开头用一页复习了材料一，然后进入“参数估计”。它的主线是：

$$
\theta \;\longrightarrow\; f_X(x\mid\theta) \;\longrightarrow\; X=x \;\longrightarrow\; \hat\theta(x).
$$

和材料一相比，区别只在于最后的动作：材料一是“选假设”，材料二是“给数值”。

### 3.1 p 值（p-value）：假设检验的“证据强度”

第 2 页给出 p 值的定义：

> 对一类虚警率为 \(\alpha\) 的检验，观测到 \(X=x\) 后，p 值是“使检验判 \(H_1\)”的最小 \(\alpha\)。

更操作化的定义（第 3 页）：

如果检验具有形式（\(T(x)\): test statistic；\(\tau\): threshold）

$$
\delta(x)=
\begin{cases}
H_1, & T(x)\ge \tau,\\
H_0, & T(x)<\tau,
\end{cases}
$$

那么观测 \(z\) 的 p 值（p-value）是

$$
\boxed{
p(z)=P\big(T(X)\ge T(z)\mid H_0\big)
}
$$

也就是：**在 \(H_0\) 下，观测到“和 \(z\) 一样极端或更极端”的数据的概率。**

“更极端”的方向要由 \(H_1\) 决定。如果 \(H_1\) 是 \(\theta>\theta_0\)，那么“更极端”就是 \(T(X)\) 更大；如果 \(H_1\) 是 \(\theta<\theta_0\)，方向就反过来。

**硬币例子**（第 3–4 页）：

- \(H_0:\theta=\frac12\)，\(H_1:\theta>\frac12\)。
- 5 次全是正面：\(p=(\frac12)^5=\frac1{32}\approx 0.031\)。
- 4 次或 5 次正面：\(p=\frac1{32}+\binom51\frac1{32}=\frac6{32}\approx 0.188\)。

注意第二个例子：p 值不是“恰好 4 次正面”的概率，而是“**4 次或更多**正面”的概率。这就是“更极端”的含义。

**经验法则**（第 2 页）：

| p 值范围 | 证据强度 |
|---|---|
| \(p<0.01\) | very strong evidence |
| \(0.01<p<0.05\) | strong evidence |
| \(0.05<p<0.1\) | weak evidence |
| \(p>0.1\) | little to no evidence |

> **重要提醒**：p 值不是 \(P(H_0\mid \text{data})\)。它是在 \(H_0\) 为真的前提下，数据（或更极端数据）出现的概率。把 p 值当成“H0 为真的概率”是常见的误解。

### 3.2 参数推断的三类问题（Parametric Inference Problems）

第 4 页把参数推断分成三类：

```text
Parametric Inference Problems
├─ Hypothesis Testing      （材料一，已讲）
├─ Point Estimation        （材料二重点）
└─ Confidence Interval     （材料二最后）
```

- **假设检验**：在离散假设之间做选择。
- **点估计**：给 \(\theta\) 一个数 \(\hat\theta\)。
- **区间估计**：给 \(\theta\) 一个区间 \(C_n=(a_n,b_n)\)，使得

$$
P(\theta\in C_n)\ge 1-\alpha.
$$

### 3.3 估计量的评价（Performance Metrics）：偏差、标准误、一致性

第 5 页给出三个基本指标。

**偏差（Bias of the Estimation）**：

$$
\operatorname{bias}(\hat\theta)
=
E[\hat\theta-\theta]
=
E[\hat\theta]-\theta.
$$

- \(\hat\theta\) 依赖数据，所以是随机变量。
- 若 \(\operatorname{bias}(\hat\theta)=0\)，称 \(\hat\theta\) 是**无偏估计（unbiased estimator）**。
- 偏差衡量“平均而言，估计值偏离真值多少”。

**标准误（Standard Error）**：

$$
\operatorname{SE}(\hat\theta)
=
\sqrt{\operatorname{Var}(\hat\theta-\theta)}.
$$

在频率派设定下，\(\theta\) 是固定但未知的常数，不是随机变量，所以

$$
\operatorname{Var}(\hat\theta-\theta)=\operatorname{Var}(\hat\theta),
$$

于是

$$
\operatorname{SE}(\hat\theta)=\sqrt{\operatorname{Var}(\hat\theta)}.
$$

标准误衡量“估计值的随机波动有多大”。

**一致性（Consistent Estimator）**：

$$
\hat\theta_n \xrightarrow{p}\theta
\qquad (n\to\infty).
$$

也就是说，随着样本量增加，估计量依概率收敛到真值。

> **补充（原讲义未展开）**：偏差和方差可以合起来看均方误差：
> $$
> E[(\hat\theta-\theta)^2]
> =
> \operatorname{Var}(\hat\theta)+\operatorname{bias}(\hat\theta)^2.
> $$
> 这条恒等式解释了为什么“无偏”不一定是唯一目标：一个有偏但方差很小的估计量，均方误差可能更小。材料二后面的贝叶斯估计（MMSE）就是从均方误差的角度来定义最优性的。

### 3.4 最大似然估计（Maximum Likelihood Estimation, MLE）

第 6–9 页讲 MLE。

**似然函数（Likelihood Function）**：设 \(X_1,\dots,X_n\) 独立同分布，密度为 \(f_X(x\mid\theta)\)，观测到 \(\vec x=(x_1,\dots,x_n)\)，则

$$
L(\theta;\vec x)
=
f_{\vec X}(\vec x\mid\theta)
=
\prod_{i=1}^n f_{X_i}(x_i\mid\theta).
$$

**对数似然（Log-likelihood Function）**：

$$
\ell(\theta;\vec x)
=
\log L(\theta;\vec x)
=
\sum_{i=1}^n \log f_{X_i}(x_i\mid\theta).
$$

**MLE 定义（Maximum Likelihood Estimator）**：

$$
\boxed{
\hat\theta_{ML}
=
\arg\max_\theta L(\theta;\vec x)
=
\arg\max_\theta \ell(\theta;\vec x)
}
$$

**MLE 的性质**（第 7 页）：

1. **一致性（consistency）**：\(\hat\theta_n\xrightarrow{p}\theta\)。
2. **渐近正态性（asymptotic normality）**：

$$
\frac{\hat\theta_n-\theta}{\sqrt{\operatorname{Var}(\hat\theta_n)}}
\xrightarrow{d}
\mathcal N(0,1).
$$

3. **渐近最优性（asymptotic optimality）**：在所有估计量中，MLE 渐近方差最小；达到同样误差水平所需的样本量最少。

**伯努利例子**（第 7–9 页）：

设

$$
X_i\sim\operatorname{Bernoulli}(\theta),\qquad
P(X_i=1)=\theta,\quad P(X_i=0)=1-\theta.
$$

似然：

$$
L(\theta)
=
\prod_{i=1}^n \theta^{x_i}(1-\theta)^{1-x_i}
=
\theta^S(1-\theta)^{n-S},
\qquad
S=\sum_{i=1}^n x_i.
$$

对数似然：

$$
\ell(\theta)=S\log\theta+(n-S)\log(1-\theta).
$$

求导并令其为零：

$$
\frac{d\ell}{d\theta}
=
\frac{S}{\theta}-\frac{n-S}{1-\theta}
=
0.
$$

解得

$$
\boxed{
\hat\theta_{ML}=\frac{S}{n}
}
$$

也就是样本中正面的比例。这里 \(S\) 是**充分统计量（sufficient statistic）**：只要知道 \(S\)，不需要知道每次具体是正面还是反面，就能算出 MLE。

### 3.5 贝叶斯估计（Bayesian Estimation）：从“最大似然”到“后验”

第 10–12 页把 \(\theta\) 看成随机变量，并给出先验 \(f_\Theta(\theta)\)。

**后验（Posterior Distribution）**：

$$
f_{\Theta\mid\vec X}(\theta\mid\vec x)
=
\frac{f_{\vec X\mid\Theta}(\vec x\mid\theta)f_\Theta(\theta)}
{f_{\vec X}(\vec x)}
\;\propto\;
f_{\vec X\mid\Theta}(\vec x\mid\theta)f_\Theta(\theta).
$$

**MAP 估计（MAP Estimator）**：

$$
\boxed{
\hat\theta_{MAP}
=
\arg\max_\theta f_{\Theta\mid\vec X}(\theta\mid\vec x)
=
\arg\max_\theta L(\theta;\vec x)f_\Theta(\theta)
}
$$

MAP 看的是后验分布的**众数（mode）**。

**一般的贝叶斯估计（General Bayesian Estimator）**：给定代价函数 \(C(\hat\theta,\theta)\)，选择

$$
\boxed{
\hat\theta_{Bayes}
=
\arg\min_{\hat\theta}
E\big[C(\hat\theta,\Theta)\mid \vec X=\vec x\big]
}
$$

不同的代价函数给出不同的后验位置：

| 估计器 | 代价函数 | 最优解 | 后验分布的位置 |
|---|---|---|---|
| **MAP** | 0-1 型代价 | \(\arg\max_\theta f_{\Theta\mid\vec X}(\theta\mid\vec x)\) | 众数 mode |
| **MMSE** | \(C(\hat\theta,\theta)=(\hat\theta-\theta)^2\) | \(E[\Theta\mid\vec X=\vec x]\) | 均值 mean |
| **MAE** | \(C(\hat\theta,\theta)=\lvert\hat\theta-\theta\rvert\) | 后验中位数 | 中位数 median |

其中：

$$
\boxed{
\hat\theta_{MMSE}
=
E[\Theta\mid\vec X=\vec x]
=
\operatorname{mean}\big(f_{\Theta\mid\vec X}(\theta\mid\vec x)\big)
}
$$

$$
\boxed{
\hat\theta_{MAE}
=
\operatorname{median}\big(f_{\Theta\mid\vec X}(\theta\mid\vec x)\big)
}
$$

这三个估计器可以记成一句话：**MAP 取众数，MMSE 取均值，MAE 取中位数。**

**MAP 与 MLE 的关系**：

$$
\hat\theta_{MAP}
=
\arg\max_\theta L(\theta;\vec x)f_\Theta(\theta).
$$

- MLE 只最大化 \(L(\theta;\vec x)\)。
- MAP 还要乘上先验 \(f_\Theta(\theta)\)。
- 如果先验是均匀分布（在参数空间上为常数），那么 MAP 退化为 MLE。
- 先验不是均匀时，MAP 会被先验“拉”向先验概率高的区域。

### 3.6 置信区间（Confidence Interval）：用 Hoeffding 不等式做区间估计

第 12–14 页用 Hoeffding 不等式构造置信区间。

**Hoeffding 不等式（Hoeffding Inequality）**：设 \(X_1,X_2,\dots\) 独立，且 \(0\le X_i\le 1\)，令

$$
S_n=\sum_{i=1}^n X_i,\qquad
\bar S_n=\frac{S_n}{n}.
$$

则对任意 \(\epsilon>0\)，

$$
\boxed{
P\big(\lvert \bar S_n-E[\bar S_n]\rvert>\epsilon\big)
\le
2e^{-2n\epsilon^2}
}
$$

**伯努利例子**：\(X_i\in\{0,1\}\)，\(P(X_i=1)=\theta\)，则 \(E[\bar S]=\theta\)，于是

$$
P\big(\lvert \bar S-\theta\rvert>\epsilon\big)
\le
2e^{-2n\epsilon^2}.
$$

因此，以至少

$$
1-2e^{-2n\epsilon^2}
$$

的概率，有

$$
\theta\in[\bar S-\epsilon,\ \bar S+\epsilon].
$$

这就是一个**置信区间（Confidence Interval）**，宽度为 \(2\epsilon\)，中心是样本比例 \(\bar S\)。

**把它写成置信水平的形式**：令

$$
\delta=e^{-2n\epsilon^2},
$$

则置信水平为 \(1-2\delta\)（失败概率为 \(2\delta\)，每侧 \(\delta\)），且

$$
\epsilon=\sqrt{\frac{\log(1/\delta)}{2n}}.
$$

例如，要 \(99\%\) 置信，则 \(2\delta=0.01\)，\(\delta=0.005\)。第 14 页给出：

| 样本量 \(n\) | 99% 置信下的 \(\epsilon\) |
|---|---|
| 100 | 0.163 |
| 1000 | 0.05 |
| 10000 | 0.016 |

可以看到：**样本量越大，区间越窄；置信水平越低，区间也越窄。**

> **严格解释**：频率派置信区间的“95%”或“99%”指的是**构造区间的这套程序**的覆盖率，而不是“参数落在当前这个具体区间里的概率”。当前区间一旦算出来，参数要么在里、要么不在里；覆盖率是对重复抽样而言的。Hoeffding 区间还是**保守**的：实际覆盖率通常高于名义水平。

### 3.7 材料二的知识线（14 页）

| 页码 | 内容 |
|---|---|
| 1 | 复习材料一；ML/MAP/Bayes 对照；似然比 |
| 2 | p 值定义；经验法则 |
| 3 | p 值定理；阈值检验；硬币例子 |
| 4 | p 值计算；参数推断三类问题 |
| 5 | 估计的动机；偏差、标准误、一致性 |
| 6 | 似然函数；对数似然 |
| 7 | MLE 定义；渐近性质；伯努利模型 |
| 8 | 伯努利似然；充分统计量 |
| 9 | 伯努利 MLE 求导 |
| 10 | 贝叶斯设定；MAP 估计 |
| 11 | 一般贝叶斯估计；L2 损失；MMSE |
| 12 | MAP=众数；MAE=中位数；Hoeffding |
| 13 | 硬币的置信区间 |
| 14 | 区间宽度；数值例子 |

---

## 4. 两份讲义的联系：同一个贝叶斯模板

把两份讲义放在一起，会发现它们只是“状态空间”不同：

| 维度 | 材料一：假设检验 | 材料二：参数估计 |
|---|---|---|
| 未知量 | 离散假设 \(H_i\) | 连续参数 \(\theta\) |
| 先验 | \(P(H_i)\) | \(f_\Theta(\theta)\) |
| 似然 | \(f_X(x\mid H_i)\) | \(f_{\vec X}(\vec x\mid\theta)\) |
| 后验 | \(P(H_i\mid x)\) | \(f_{\Theta\mid\vec X}(\theta\mid\vec x)\) |
| 动作 | 判 \(H_0\) / \(H_1\) | 给出 \(\hat\theta\) |
| 代价 | 代价矩阵 \(C_{ij}\) | 代价函数 \(C(\hat\theta,\theta)\) |
| 最优规则 | Bayes / MAP / ML | Bayes / MAP / MMSE / MAE |
| 核心结论 | 均匀代价下 MAP 最小化错误率 | L2 下 MMSE 是后验均值，L1 下 MAE 是后验中位数 |

统一的贝叶斯公式：

$$
\text{后验}
=
\frac{\text{似然}\times\text{先验}}{\text{证据}}.
$$

离散情形：

$$
P(H_i\mid x)
=
\frac{f_X(x\mid H_i)P_i}{f_X(x)}.
$$

连续情形：

$$
f_{\Theta\mid\vec X}(\theta\mid\vec x)
=
\frac{f_{\vec X\mid\Theta}(\vec x\mid\theta)f_\Theta(\theta)}
{f_{\vec X}(\vec x)}.
$$

两者的结构完全一样。**材料一是“离散后验 + 0-1 代价”，材料二是“连续后验 + 平方/绝对/0-1 代价”。**

---

## 5. 公式速查表

### 5.1 假设检验

**错误率与代价**：

$$
P(\text{error})=P_0P_{FA}+P_1P_M.
$$

$$
E[C]
=
P_0C_{00}+P_1C_{11}
+
P_0P_{FA}(C_{10}-C_{00})
+
P_1P_M(C_{01}-C_{11}).
$$

**贝叶斯阈值**：

$$
\Lambda(x)
=
\frac{f_X(x\mid H_1)}{f_X(x\mid H_0)}
\;\underset{H_0}{\overset{H_1}{\gtrless}}\;
\frac{C_{10}-C_{00}}{C_{01}-C_{11}}
\cdot
\frac{P_0}{P_1}.
$$

**均匀代价**：

$$
C_{00}=C_{11}=0,\quad C_{10}=C_{01}=1
\;\Longrightarrow\;
\Lambda(x)\gtrless \frac{P_0}{P_1}
\;\Longleftrightarrow\;
P(H_1\mid x)\gtrless P(H_0\mid x).
$$

**高斯位置例子**：

$$
\tau_{ML}=\frac{\theta_0+\theta_1}{2},
\qquad
\tau_{MAP}
=
\frac{\theta_0+\theta_1}{2}
+
\frac{\sigma^2}{\theta_1-\theta_0}
\ln\frac{P_0}{P_1}.
$$

### 5.2 参数估计

**偏差与标准误**：

$$
\operatorname{bias}(\hat\theta)=E[\hat\theta]-\theta,
\qquad
\operatorname{SE}(\hat\theta)=\sqrt{\operatorname{Var}(\hat\theta)}.
$$

**MLE**：

$$
\hat\theta_{ML}
=
\arg\max_\theta \prod_{i=1}^n f_{X_i}(x_i\mid\theta).
$$

**伯努利 MLE**：

$$
\hat\theta_{ML}=\frac{S}{n},\qquad S=\sum_{i=1}^n x_i.
$$

**MAP / MMSE / MAE**：

$$
\hat\theta_{MAP}
=
\arg\max_\theta f_{\Theta\mid\vec X}(\theta\mid\vec x),
$$

$$
\hat\theta_{MMSE}=E[\Theta\mid\vec X=\vec x],
\qquad
\hat\theta_{MAE}=\operatorname{median}(\Theta\mid\vec X=\vec x).
$$

**Hoeffding 置信区间**：

$$
P\big(\lvert\bar S-\theta\rvert>\epsilon\big)
\le
2e^{-2n\epsilon^2},
$$

$$
\theta\in[\bar S-\epsilon,\bar S+\epsilon]
\quad\text{with confidence}\quad
1-2e^{-2n\epsilon^2}.
$$

---

## 6. 自测题（附答案要点）

1. **为什么均匀代价下 Bayes 规则等于 MAP？**  
   因为代价比变成 \(1\)，判决阈值只剩先验比 \(P_0/P_1\)，而后验 odds 恰好是 \(\Lambda(x)P_1/P_0\)，所以比较 \(\Lambda(x)\) 与 \(P_0/P_1\) 等价于比较后验概率。

2. **均匀代价下，为什么 \(E[\text{cost}]=P(\text{error})\)？**  
   因为 \(C_{00}=C_{11}=0\)、\(C_{10}=C_{01}=1\)，期望代价只剩 \(P_0P_{FA}+P_1P_M\)，这正是全概率公式给出的错误概率。

3. **如果虚警代价 \(C_{FA}\) 变大，判决阈值怎么移动？**  
   阈值 \(\frac{C_{FA}}{C_M}\frac{P_0}{P_1}\) 变大，更难判 \(H_1\)，即更保守。

4. **如果先验 \(P_0\) 变大，阈值怎么移动？**  
   \(P_0/P_1\) 变大，阈值变大，更倾向判 \(H_0\)。

5. **MAP 和 ML 什么时候相同？**  
   当先验相等（或先验为常数）时，MAP 退化为 ML。均匀代价本身只保证 MAP，不保证 ML。

6. **p 值是不是 \(P(H_0\mid \text{data})\)？**  
   不是。p 值是在 \(H_0\) 为真的前提下，观测到当前数据或更极端数据的概率；\(P(H_0\mid \text{data})\) 是后验概率，需要先验才能算。

7. **MMSE 为什么是后验均值？**  
   因为平方损失 \(E[(\hat\theta-\Theta)^2\mid x]\) 对 \(\hat\theta\) 求导，最优解满足 \(\hat\theta=E[\Theta\mid x]\)。

8. **Hoeffding 置信区间为什么是保守的？**  
   它只利用了随机变量有界和独立，没有利用具体分布形状，因此界通常比精确区间更宽，覆盖率不低于名义水平。

---

## 7. 一页纸记忆版

- **假设检验三件事**：先验 \(P_i\)、似然 \(f_X(x\mid H_i)\)、代价 \(C_{ij}\)。
- **判决阈值**：\(\Lambda(x)\gtrless \frac{C_{10}-C_{00}}{C_{01}-C_{11}}\frac{P_0}{P_1}\)。
- **均匀代价**：\(C_{00}=C_{11}=0,\ C_{10}=C_{01}=1\)。
- **均匀代价的后果**：Bayes = MAP；\(E[C]=P(\text{error})\)；MAP 最小化错误率。
- **MAP vs ML**：MAP 多乘了一个先验；先验相等时二者相同。
- **参数估计三件套**：偏差、标准误、一致性。
- **MLE**：最大化似然；伯努利例子 \(\hat\theta=S/n\)。
- **贝叶斯估计**：MAP 取众数，MMSE 取均值，MAE 取中位数。
- **置信区间**：Hoeffding 给出分布无关的保守区间，宽度随 \(n\) 增大而变小。

---

## 8. English Summary（一分钟英文复述）

- **Hypothesis testing** starts with a hidden parameter \(\theta\), a parametric model \(f_X(x\mid\theta)\), and an observation \(X=x\). We design a **decision rule** to choose between \(H_0\) and \(H_1\).
- The **likelihood ratio** is \(\Lambda(x)=f_X(x\mid H_1)/f_X(x\mid H_0)\). The **Bayes decision rule** compares it with \(\frac{C_{10}-C_{00}}{C_{01}-C_{11}}\cdot\frac{P_0}{P_1}\).
- Under **uniform cost** (\(C_{00}=C_{11}=0,\ C_{10}=C_{01}=1\)), the Bayes rule reduces to the **MAP rule**, \(\Lambda(x)\gtrless P_0/P_1\).
- Under uniform cost, **expected cost equals probability of error**: \(E[\text{cost}]=P_0P_{FA}+P_1P_M=P(\text{error})\). Therefore, the **MAP rule minimizes the probability of error**.
- In **estimation**, MLE maximizes the likelihood; MAP maximizes the posterior; MMSE is the posterior mean; MAE is the posterior median.
- The **Hoeffding inequality** gives a distribution-free confidence interval for independent bounded random variables.

---

## 附录：页码索引

### 材料一（16 页）

| 页 | 关键词 |
|---|---|
| 1 | 大图景、二值/M 元、简单/复合、温度例子 |
| 2 | 条件密度、三个应用 |
| 3 | 四格表、两类错误 |
| 4 | 特异度、灵敏度、精确率 |
| 5 | 错误概率、代价、贝叶斯风险 |
| 6 | 高斯位置例子 |
| 7 | 阈值形式、ML |
| 8 | 似然比、高斯 ML |
| 9 | ML 阈值、MAP 引入 |
| 10 | MAP、Bayes、对照表 |
| 11 | 高斯 MAP 阈值 |
| 12 | 先验与噪声/信号比 |
| 13 | 四代价模型 |
| 14 | 贝叶斯决策规则 |
| 15 | 均匀代价、文末总结 |
| 16 | 贝叶斯规则证明 |

### 材料二（14 页）

| 页 | 关键词 |
|---|---|
| 1 | 复习、ML/MAP/Bayes |
| 2 | p 值、经验法则 |
| 3 | p 值定理、硬币例子 |
| 4 | p 值计算、参数推断分类 |
| 5 | 偏差、标准误、一致性 |
| 6 | 似然、对数似然 |
| 7 | MLE、渐近性质、伯努利 |
| 8 | 伯努利似然、充分统计量 |
| 9 | 伯努利 MLE |
| 10 | 贝叶斯设定、MAP |
| 11 | 一般贝叶斯估计、MMSE |
| 12 | MAP=众数、MAE=中位数、Hoeffding |
| 13 | 硬币置信区间 |
| 14 | 区间宽度、数值例子 |

---

> **最后再强调一次**：材料一文末的三条总结，核心不是三个需要死记的句子，而是一条链：
>
> $$
> \text{最小化期望代价}
> \;\xrightarrow{\text{均匀代价}}\;
> \text{最小化错误概率}
> \;\Longleftrightarrow\;
> \text{MAP}.
> $$
>
> 只要记住“**阈值 = 代价比 × 先验比**”，以及“**均匀代价把代价比变成 1**”，三条结论都可以现场推出来。
