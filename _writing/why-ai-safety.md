---
layout: beyond
title: "Why Does AI Alignment Matter to Me?"
navbar_title: Writing
kicker: "Technical AI safety"
description: "My motivation, research direction, and current engagement with technical AI alignment."
author: "Phu Gia Hoang"
format_label: "Format"
format: "One-page research statement"
status_lines:
  - "Living note"
  - "Technical AI safety"
kind: "Research statement"
listing_kind: "Technical AI safety · Research statement"
date: 2026-08-16
permalink: /writing/why-ai-safety/
writing_article: true
toc:
  - title: "Why AI alignment?"
    anchor: "why-ai-alignment"
  - title: "Target roles"
    anchor: "target-roles"
  - title: "Experience"
    anchor: "experience"
  - title: "Engagement with AI safety"
    anchor: "engagement-with-ai-safety"
  - title: "Actions"
    anchor: "actions"
---

<p class="article-context-note">This page grew out of <a href="https://bluedot.org/certification?id=reccMFGhUQa4gnnlq">BlueDot's Technical AI Safety course</a>. I found the exercise useful, so I am sharing it here to document my commitment and contributions to this field.</p>

## Why AI Alignment? {#why-ai-alignment}

I am focusing on **technical AI alignment**, particularly mechanistic interpretability, representation engineering, and methods for reliably understanding and controlling model behavior.

AI alignment matters to me because I believe our relationship with AI is about to change fundamentally. Today, we mostly treat AI as a tool. But as it becomes better than us at research, planning, and decision-making, delegating more responsibility to it may become the more efficient choice. Because of that, I find it unacceptable that we could build and train these systems ourselves, become deeply dependent on them, and still not understand how they make important decisions or how their behavior might shift in unfamiliar situations.

I am also drawn to this research because it offers fast feedback loops: I can form hypotheses about model behavior, intervene directly, observe the effects, and iteratively refine my understanding. More broadly, I am interested in safety across the entire AI-development lifecycle, from training-data curation and early detection of emerging capabilities to post-training alignment, mechanistic interpretability, deployment-time control, and continuous monitoring.

## Target Roles {#target-roles}

I am primarily interested in **research scientist and research engineer roles in technical AI safety**, particularly mechanistic interpretability, representation geometry, model steering and control, and empirical alignment. I am also exploring technical safety fellowships and **PhD opportunities in mechanistic interpretability and AI safety**, with a current goal of applying to US PhD programs for Fall 2027.

## Experience {#experience}

- **Mechanistic interpretability @ UKP Lab, TU Darmstadt.** I introduced **Feature-Effect Geometry Analysis (FEGA)**, an unsupervised causal framework for studying how sparse autoencoder features affect model outputs across contexts. Our results show that clean one-dimensional downstream effects are rare: interpretable and causally relevant SAE features do not necessarily provide reliable steering directions. The work is currently under review at JMLR. [Project](https://ukplab.github.io/FEGA/) · [Paper](https://arxiv.org/abs/2607.24645) · [Code](https://github.com/UKPLab/FEGA)
- **Efficient LLM inference @ M.Sc. thesis, MBZUAI.** I developed and evaluated a training-free method for reusing internal representations across repeated token spans in Qwen2.5-3B. Shallow-layer representation reuse preserved model outputs while avoiding redundant computation.
- **NLP research and dataset development.** I led **ViHOS**, a dataset of 11,056 Vietnamese comments with span-level hate and offensive-language annotations and benchmark experiments. The work was published as a first-author paper at EACL 2023. [Paper](https://aclanthology.org/2023.eacl-main.47/) · [Code](https://github.com/phusroyal/ViHOS)
- **ML systems and engineering.** I worked as an AI Engineer at VinBigData on multilingual fine-grained NER, improving English and Bangla baselines for SemEval-2023 MultiCoNER II. At Fujairah Research Center, I built an internal RAG assistant spanning retrieval, prompt orchestration, backend logic, and response-generation workflows.
- **Research background.** I hold an M.Sc. in NLP from MBZUAI and a B.Sc. in Data Science from VNU-HCM University of Information Technology. My research spans mechanistic interpretability, sparse autoencoders, causal interventions, representation geometry, model steering, efficient generation, and NLP.

## Engagement with AI Safety {#engagement-with-ai-safety}

<div class="application-log">
  <div class="application-log-entry">
    <div class="application-log-heading">
      <strong><a href="https://bluedot.org/certification?id=reccMFGhUQa4gnnlq">BlueDot Technical AI Safety</a></strong>
      <time datetime="2026-08">Aug 2026</time>
    </div>
    <p class="application-log-status">Completed the course.</p>
  </div>
  <div class="application-log-entry">
    <div class="application-log-heading">
      <strong>BlueDot Technical AI Safety Puzzle #1</strong>
      <time datetime="2026-07">Jul 2026</time>
    </div>
    <p class="application-log-status">Received an Honorable Mention for training a model to encode a semantic feature along a chosen nonlinear manifold using only three reserved channels. <a href="https://www.lesswrong.com/posts/ZwEer94AefjdW4933/can-we-teach-a-model-to-encode-a-semantic-feature-on-a">LessWrong write-up</a></p>
  </div>
  <div class="application-log-entry">
    <div class="application-log-heading">
      <strong>Feature-Effect Geometry Analysis (FEGA)</strong>
      <time datetime="2026-07">Jul 2026</time>
    </div>
    <p class="application-log-status">Developing an unsupervised causal framework for studying how SAE features affect model outputs across contexts. Our results show that interpretable SAE features rarely produce consistent one-dimensional effects, limiting their reliability as steering directions. <a href="https://ukplab.github.io/FEGA/">Project</a> · <a href="https://arxiv.org/abs/2607.24645">Paper</a></p>
  </div>
  <div class="application-log-entry">
    <div class="application-log-heading">
      <strong>Murano</strong>
      <time datetime="2026-08">Aug 2026</time>
    </div>
    <p class="application-log-status">Contributed to an open-source toolkit for designing, running, and reproducing mechanistic interpretability experiments as composable pipelines. Accepted to the EMNLP 2026 System Demonstrations Track. <a href="https://ukplab.github.io/murano/">Project</a> · <a href="https://arxiv.org/abs/2608.30662">Paper</a> · <a href="https://github.com/UKPLab/murano">Code</a></p>
  </div>
</div>

## Actions {#actions}

*I will try to update this section once I have more information.*

<div class="application-log">
  <div class="application-log-entry">
    <div class="application-log-heading">
      <strong>Applied to ML4GOOD</strong>
      <time datetime="2026-07">Jul 2026</time>
    </div>
    <p class="application-log-status"><strong>Accepted</strong> · Sep–Oct 2026 bootcamp.</p>
  </div>
  <div class="application-log-entry">
    <div class="application-log-heading">
      <strong>Applied to AIAF</strong>
      <time datetime="2026-08">Aug 2026</time>
    </div>
    <p class="application-log-status"><strong>Rejected · not shortlisted.</strong> The fellowship received about 3,000 applications and accepted six participants, so my application was not strong enough to stand out in such a competitive pool.</p>
  </div>
</div>
