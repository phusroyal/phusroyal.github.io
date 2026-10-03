---
tldr: My log of a two-day speed run, October 2-3.
tags:
  - note
date: "202610021448"
aliases:
related:
---

# Decision Theory: A Two-Day Sprint

## Why I chose this topic and what I actually covered

This sprint was part of my project at ML4GOOD Fall 2026. My goal was to spend the last two days of the bootcamp studying a field that I believe could help me contribute to solving AI alignment [[1-pager AI-safety]].

There were several reasons I chose to study decision theory.

First, many AI alignment roles require a combination of AI knowledge, technical skills, and an understanding of AI safety and decision theory. The problems explored in these roles are quite interesting to me, for example, those at CHAI and Redwood Research, including conceptual evaluations.

Second, I have long been curious about philosophical theories, particularly from the perspective of someone who has been doing AI research since university. I have always thought that philosophy is very different in both its scope and its methods. I have also long understood philosophy as the science of all sciences, which makes me even more curious.

Third, ML4GOOD provided the time, space, other participants, and access to experts. This felt like a great setting to explore the subject.

Two days is not much time, and ML4GOOD also requires an output (which is this post), so spreading myself across too many topics would not make sense. It was important to choose a narrow but interesting goal, something worth exploring and relevant to what I care about. I chose two main resources for these two days: the [Cooperative AI curriculum](https://www.cooperativeai.com/curriculum) and Martin Peterson's *An Introduction to Decision Theory* (second edition, 2017).

With Astra's help, I put together a plan around a central question:

> Before calling a decision rational, what do I need to specify? And what can I conclude from the information I have?

I read quite slowly because I keep stopping to ask whether I understand a concept well enough to come up with an example of my own.

## Where I was at the start

> What does it mean to make a rational decision? And why can individually rational agents still fail to cooperate with one another?

I didn't know shit about decision theory or game theory. In fact, most of my life decisions have been quite spontaneous or made by rolling dice (asking my ancestors to choose for me; if it goes wrong, it's because I'm an idiot, and if it goes right, it's heaven's will). So here was what I thought:

**A rational decision:** I would consider a decision rational if, first of all, I felt satisfied with what it brought me or cost me. If there were constraints, my decision should also try to meet them as much as possible without doing too much damage to my original goal, or at least only to a limited extent.

**Cooperative agents:** Parties working together, each with their own requirements and goals? I guess so :D

## What is cooperative AI?

[What is Cooperative AI?](https://www.cooperativeai.com/curriculum/1-what-is-cooperative-ai)

The goal is to understand the broader picture of cooperative AI, the risks arising from multi-agent interactions, and how advanced AI could create opportunities to improve human cooperation.

The approach is to apply classic game-theory problems to AI agents and understand why single-agent alignment is not enough for future multi-agent systems.

### Introduction by Lewis Hammond

[Introduction to Summer School by Lewis Hammond (YouTube)](https://www.youtube.com/watch?v=Lm64221F2ek&t=710s)

Cooperative AI studies cooperation among humans, machines, and organizations. The aim is to reduce risks resulting from AI cooperation problems and increase the gains from AI-mediated cooperation.

Why are cooperation problems in AI different from ordinary cooperation problems?

- AI understands information differently from biological organisms, making cooperation harder.
- AI does not have biological organs, making cooperation easier.

### Alignment vs. cooperation

**Alignment:** We care about AI pursuing or acting according to what we want, including our values and objectives.

**Cooperation:** Agents or other parties, whether humans or machines, cooperate with their own preferences, but the goal is for all parties to be satisfied.

**Combining both:** We have AI that genuinely wants to pursue our goals and values, and everyone benefits when we cooperate with it or when AI systems cooperate with one another.

### Cooperative intelligence

[Cooperative AI: Three things that confused me as a beginner (and my current understanding)](https://forum.effectivealtruism.org/posts/yYpwXPiGLL7Kbdhev/cooperative-ai-three-things-that-confused-me-as-a-beginner)

This article tries to distinguish the boundaries between AI alignment, AI safety, and cooperative AI. The author's central explanation is that cooperative AI is about working towards good outcomes when cooperating with powerful AI in a messy world. These AI systems may be aligned with different, sometimes conflicting values on behalf of different groups of people.

Another framing is that cooperative AI aims to improve cooperative intelligence, through which agents or other parties achieve their goals while promoting social welfare.

The difference from AI alignment is that AI systems aligned with their own values (single-value alignment) may each make individually rational decisions when placed in social dilemmas, such as defecting in the Prisoner's Dilemma. Yet everyone would benefit more if all parties cooperated. So, in a world with powerful AI, alignment does not automatically solve social dilemmas.

The components of cooperative intelligence include:

- **Understanding:** Understanding consequences, anticipating other parties' behavior, and understanding the implications of their beliefs and preferences.
- **Communication:** Sharing clear and reliable information about behavior, intentions, and preferences.
- **Commitment:** Making credible promises.
- **Norms and institutions:** Social infrastructure, shared beliefs, or rules that support understanding, communication, and commitment.

These components are dual-use because they can also enable these systems to deceive, manipulate, and blackmail.

### Exercise 1.1

An example of a persistent cooperation problem:

**The weekend:** Henry Ford created regular days off to address a dilemma faced by both workers and factories. Workers wanted time to rest, while factories wanted workers to be more productive. The weekend allowed workers to rest and spend time on themselves. Factories also benefited because rest at fixed times would improve productivity without causing unpredictable disruptions.

### Exercise 1.2

Interventions to improve cooperation among AI agents that would not be feasible for humans:

- Asking parties to describe or list everything they possess during negotiations. AI agents can do this easily, but for humans, trust gets in the way.
- Running a large number of repeated attempts at cooperation. Humans cannot do this because they are not machines.

What humans can do that AI agents cannot:

Humans can understand what is worth gaining or giving up because they understand preferences. AI has difficulty doing this when the specification is incomplete or unclear.

### Foundational challenges in multi-agent safety

[Foundational Challenges in Assuring Alignment and Safety of Large Language Models](https://arxiv.org/pdf/2404.09932)

The paper surveys and outlines problems in LLM alignment and safety: 18 foundational challenges and more than 200 research questions.

Multi-agent safety assurances do not follow from single-agent safety.

#### 1. The effects of single-agent training on multi-agent interactions remain unclear

Current LLMs undergo massive pretraining but relatively little fine-tuning. Their interactions therefore depend heavily on experiences embedded in the pretraining data, combined with interactions with the environment through ICL.

Relevant dispositional traits include helpfulness, altruism, selfishness, human-like emotions such as envy or retaliation, and awareness of and adherence to social norms and conventions.

Relevant capabilities include bargaining and negotiation, theory of mind, manipulation, and making or enforcing commitments.

To understand these, we need dedicated evaluations. Agents should also be evaluated in adversarial settings to see whether their behavior remains consistent throughout.

#### 2. Shared foundations can cause correlated failures

Pretraining is very expensive, so many agents may use similar or identical underlying models.

The upside is that these similarities can be used to promote cooperation. The downside is that the agents become vulnerable to correlated problems.

A solution is to make agents sufficiently diverse. But how do we achieve diversity and robustness? Are different personas or different sets of ethical rules enough? Through fine-tuning?

#### 3. Groups of agents can develop emergent capabilities

Interactions among agents create feedback loops that produce novel, emergent behaviors that do not occur when the agents operate independently.

Previous multi-agent research has shown examples such as unusual tool use, trading goods, and group-level coordination that a single agent cannot achieve.

This is dangerous for two reasons: the new capabilities may themselves be dangerous, and assurance becomes harder because these behaviors are difficult to predict and prevent.

**Can we predict when emergent behavior will appear?**

#### 4. Collusion among LLM agents

Even simple systems already show this tendency.

Collusion can happen through open communication or steganographic communication. Steganography means hiding secret information inside content that looks completely ordinary. See [Preventing Language Models From Hiding Their Reasoning](https://arxiv.org/abs/2310.18512).

[Secret Collusion among AI Agents: Multi-Agent Deception via Steganography](https://arxiv.org/abs/2402.07510) shows steganographic collusion among agents even without encouraging them to do so, and even when they are instructed not to. The reason is not an intention to deceive, but the optimization of a misaligned objective when covert behavior improves performance on a shared task.

Current techniques cannot detect steganography. See [Perfectly Secure Steganography Using Minimum Entropy Coupling](https://arxiv.org/abs/2210.14889).

#### 5. Applying multi-agent RL research to LLMs

Multi-agent problems such as social dilemmas have been studied extensively by the MARL community. Approaches include:

- **Utility transfer** (Kalai and Kalai, 2013; Lupu and Precup, 2020; Yang et al., 2020).
- **Contracts and transparency** (Christoffersen et al., 2023; Critch et al., 2022).
- **Reputation and punishment** (Milinski et al., 2002; Henrich, 2006; Boyd et al., 2010; Moon and Conitzer, 2015).
- **Opponent-shaping and adaptive mechanism design** (Foerster et al., 2018; Pardoe et al., 2006; Yang et al., 2021; Zheng et al., 2022).
- **Intrinsic motivations**, such as inequity aversion, altruism, or social influence (Jaques et al., 2019; Hughes et al., 2018; Wang et al., 2019a; McKee et al., 2020).

Difficulties in transferring these approaches:

**No explicit objective function:** Unlike traditional agents in game theory and RL, LLM agents do not have clearly represented objectives. Even with prompting or additional RL fine-tuning, the influence of pretraining does not fit neatly into existing game-theory frameworks (**adapter / LoRA?**). This leads to different learning dynamics and, consequently, different equilibria.

**Biases from pretraining:** Similar to human biases.

**Model size:** LLMs are too large to directly apply classical MARL methods (**just self-supervise?**).

![[Pasted image 20261002183142.png|395]]

## Decision framing

Peterson, §§1.1-1.3, §2.1, and §3.1.

### Descriptive and normative decision theory

We need to distinguish between descriptive decision theory (DDT) and normative decision theory (NDT).

**Descriptive:** Seeks to explain and predict how people actually make decisions.

**Normative:** Seeks to provide prescriptions about what a decision maker is rationally required, or ought, to do.

For example, consider someone who boxes, like me, when sparring:

**Normative = What should I do?** Should I spar a lot?

**Descriptive = Explain why, regardless of whether it is rational.** Why do I spar, even though I know that my brain repeatedly hitting my skull = getting dumber?

This book focuses on normative decision theory:

- To make right decisions, we should study it, regardless of differences in time or culture.
- From a practical perspective, DDT is difficult to reconcile with the fact that people sometimes act irrationally.

What DDT and NDT share is the starting point that decisions arise from beliefs and desires.

### Rational and right decisions

A decision can be rational without being right, and vice versa.

For example, on November 20, 1700, King Carl and his 8,000 troops attacked the Russian army of 80,000 troops led by Tsar Peter the Great. The decision was considered irrational because the attack seemed certain to fail, and the Swedes had no strategic reason to attack. However, an unexpected blizzard blinded the Russian army, and King Carl won.

King Carl's decision was right because it led to a great success. However, it was irrational because there was no good reason for it.

Theories of rationality operate on the information available at the time of the decision, not information that appears afterward.

More generally:

**An act is right** if and only if its outcome is at least as good as every other outcome.

**An act is rational** if and only if the decision maker chooses to do what they have the most reason to do at that moment.

**Instrumental rationality:** Doing whatever you have the most reason to expect will achieve your goal.

For example, my goal is not to get my teeth broken, and I am preparing to spar. Instrumental rationality: wear a mouthguard and headgear.

### Risk, ignorance, and uncertainty

**Under risk:** The decision maker knows the probabilities of the possible outcomes.

**Under ignorance:** The probabilities are unknown or do not exist.

**Uncertainty:** Either a synonym for ignorance or a broader term covering both risk and ignorance.

Decisions under ignorance involve less information than decisions under risk, but that does not mean they are harder to make. Consider the following case.

In 1967, Dr. Barnard offered Mr. Washkansky the chance to become the first person to receive a heart transplant, after many successful operations on animals. The patient was dying from a serious illness and needed a new heart. But no one had performed a heart transplant on a human before, so estimating the chance of success was meaningless. The doctor only knew that the method worked quite well on animals.

The patient's decision problem:

|              | Method works            | Method fails |
| ------------ | ----------------------- | ------------ |
| Operation    | Live for a while longer | Die          |
| No operation | Die                     | Die          |

The patient chose the operation. This was a decision under ignorance because neither he nor the doctor could assign fixed probabilities to the possible outcomes. But for the patient, having the operation was certain to be at least as good as refusing it. The operation dominated the second option.

Later, when enough data became available, this became a decision under risk. We have four hypothetical groups:

- **Group I:** People with a particular gene die 18 days after the operation (0.05 years).
- **Group II:** People die an average of 2.1 years after the operation.
- **Group III:** People die an average of 3.9 years after the operation.
- **Group IV:** People die after 14.8 years.

![[Pasted image 20261003091716.png]]

The decision rule for decisions under risk is the principle of **maximizing expected value**.

**Operation:**

$$
0.05\times0.071+2.1\times0.078+3.9\times0.139+14.8\times0.712\approx11
$$

**No operation:**

$$
1.5\times(0.071+0.078+0.139+0.712)=1.5
$$

If maximizing expected value is accepted, choosing the operation is more rational. Notice that this conclusion holds even though 7.1% of patients die after 18 days.

## The decision matrix

When making a decision, we need to identify the relevant acts, states, and outcomes. We can then formalize the problem and visualize it afterward.

### States

Intuitively, a state is a part of the world that is neither an outcome nor an act, but is relevant to the decision. Acts performed by others can presumably also be considered states.

An act produces an outcome depending on the state being considered. States should therefore be chosen so that the value of the outcomes under all states is causally independent of whether those states occur.

Here is an example of a nonsense choice of states. You are offered two bets: one pays \$100 if you win by betting on horse A, and the other pays \$200 if you win by betting on horse B.

|                | Win   | Lose |
| -------------- | ----- | ---- |
| Bet on horse A | \$100 | \$0  |
| Bet on horse B | \$200 | \$0  |

Using "win" and "lose" as the states here is nonsense. This setup will always favor betting on horse B. The reason this is wrong, and the formalization is invalid, is that whether you win is causally dependent on your choice. Whether that state occurs depends on which act you choose.

There are two ways to deal with this:

- Only allow states that are causally independent of the acts.
- Do not use states. This only works if we know the probabilities of the outcomes, such as the chances of winning or losing a bet on horse A or B.

## Decisions under ignorance

Ignorance refers to a situation where the decision maker knows their alternatives and the outcomes they lead to, but cannot assign probabilities to the states corresponding to those outcomes.

### Dominance

The dominance principle formalizes the idea that one alternative is better than another if the agent knows for certain that choosing the first will leave them at least as well off, regardless of which state occurs.

Let $\succ$ be a relation on acts, such that $a_i\succ a_j$ if and only if choosing act $a_i$ is more rational than choosing $a_j$.

$a_i\succeq a_j$ means that $a_i$ is at least as rational as $a_j$.

$a_i\sim a_j$ means that the two acts are equally rational.

Let $v(\cdot)$ be an ordinal function that assigns values to outcomes for each act-state pair.

**Weak dominance:**

$$
a_i\succeq a_j
\Leftrightarrow
v(a_j,s)\geq v(a_j,s),\quad\forall s
$$

An alternative is at least as rational as another if all its outcomes, under every state, are at least as good as the outcomes of the other alternative.

**Strong dominance:**

$$
\begin{aligned}
a_j\succ a_j\Leftrightarrow{}&v(a_i,s)\geq v(a_j,s)\quad\forall s_m\\
&\text{and}\quad\exists s_n:\ v(a_i,s_n)>v(a_j,s_n)
\end{aligned}
$$

Two conditions must hold: its outcomes under all states must be at least as good as those of the other alternative, and there must be at least one state where its outcome is strictly better.

*I'm really confused about weak dominance vs. strong dominance.*

## Decisions under risk

Unlike decisions under ignorance, in decisions under risk the decision maker knows the probabilities of the outcomes.

### Maximizing what?

We have three principles:

1. Maximize expected value (EV).
2. Maximize expected monetary value (EMV).
3. Maximize expected utility (EU).

The difference is what we multiply the probabilities by: the money received for EMV, value rather than cash for EV, or utility for EU.

$$
EMV=p_1\cdot m_1+\cdots+p_n\cdot m_n
$$

$$
EV=p_1\cdot v_1+\cdots+p_n\cdot v_n
$$

$$
EU=p_1\cdot u_1+\cdots+p_n\cdot u_n
$$
