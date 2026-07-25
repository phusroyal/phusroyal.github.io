This is my submission to [BlueDot's Technical AI Safety Puzzle #1](https://bluedot.org/puzzles/technical-ai-safety), for which I received an **Honourable Mention**. Congratulations to Gustavo Korzune Gurgel, [Patryk Perduta's LessWrong write-up](https://www.lesswrong.com/posts/TRno3dELwmMHYYH5v/bluedot-technical-ai-safety-puzzle-submission-that-got-me-a), Sam Spilllard, Karine Levonyan, and Michael Zlatin for their recognition in the puzzle.

This article focuses on my answer to Task 3: training a small MLP to encode `country` through a chosen nonlinear manifold in three reserved channels, then testing whether the model actually uses that geometry. My Task 1–2 write-up is available on [my homepage](https://phusroyal.github.io/writing/bluedot-1st-puzzle-q12/), and the [interactive version of this article](https://phusroyal.github.io/writing/bluedot-1st-puzzle-q3/) includes the figures and controls discussed below.

I welcome discussion, feedback, and collaborations that could extend this idea.

# Can We Teach a Model to Encode a Semantic Feature on a Chosen Manifold in Just Three Channels?

*BlueDot Technical AI Safety Puzzle #1 · Question 3*  
*Honourable Mention*

**Probably yes.**

With three reserved channels and explicit geometric and causal constraints, a small MLP can encode `country` on a prescribed sphere shell or helix tube while preserving task performance and causal use.

The central claim has two important limits. A visually correct manifold is not enough: the classifier must actually use it. And even when the geometry is causally active, the remaining channels can retain a backup route. This post builds the representation stage by stage, then tests both concerns directly.

This is the second of two articles answering BlueDot Technical AI Safety Puzzle #1. The first two questions are covered in [*The Country Basin*](https://phusroyal.github.io/writing/bluedot-1st-puzzle-q12/).

## The puzzle and the question

[BlueDot's Technical AI Safety Puzzle #1](https://bluedot.org/puzzles/technical-ai-safety) provides a trained five-layer MLP for multi-label classification over eight binary features, using mean-pooled sentence-transformer representations. The puzzle identifies nonlinear behavior at the output of the third ReLU, denoted as $\ell$, and asks participants to:

- find the nonlinear feature $f$;
- explain the geometry used at $\ell$ to represent $f$; and
- train a new model with a more interpretable representation.

This post addresses the third task. I train a new five-layer MLP and constrain `country` to use a chosen three-dimensional manifold while testing whether the classifier relies on that code.

**[Upload: model architecture image]**  
*Model architecture supplied with the puzzle: input text passes through a sentence-transformer encoder and a five-layer MLP to eight binary predictions. The original investigated representation is the output of the third ReLU.*

The guiding question is:

> *Can we choose a representation geometry first, then train the model so that the feature follows that geometry while still solving the original task?*

This is inspired by work on counting manifolds in language models [1] and manifold steering [2]. I use the opposite direction: instead of discovering a manifold after training, I choose a small manifold code first and ask the model to use it.

The manifold must not be decorative. I therefore ask both:

> *Did the hidden activations form the desired shape?*
>
> *But also: did the model actually use that shape to solve the task?*

My design has five requirements:

1. Specify the geometry before training.
2. Make the learned geometry code match it.
3. Preserve the original eight-label task.
4. Weaken easy shortcuts, especially linear and complement-only access.
5. Show that interventions on the geometry change the country prediction.

## 1. Define the target manifold before training

The first stage has no model. I only define what the model will later be asked to learn.

### 1.1 The distributional problem

For each example, the dataset gives the binary label $y_i^f$. It says whether `country` is present, but does not say where the example belongs on a desired manifold. For a helix, $y_i^f=1$ supplies no position $t_i$, radius $\rho_i$, or tube angle $\varphi_i$. If those coordinates were observed, I could use pointwise supervision $z_i\approx g(\xi_i)$.

Instead, I use a distributional target:

$$
\begin{aligned}
Z_1 &= \{z_i:y_i^{f^\star}=1\}\quad\text{should look like}\quad Q_1,\\
Z_0 &= \{z_i:y_i^{f^\star}=0\}\quad\text{should look like}\quad Q_0.
\end{aligned}
$$

The model is free to choose individual placements; the aggregate positive and negative code distributions must match $Q_1$ and $Q_0$. This follows the aggregate-distribution perspective of Wasserstein Auto-Encoders [3].

I choose two target geometries: a sphere shell and a helix tube. In both, positives occupy an inner radius and negatives an outer radius while both classes span the same scaffold. The label is therefore a distance-to-structure decision rather than a global direction. If positives occupied only a sphere's north pole and negatives only its south pole, the representation would be essentially linear.

### 1.2 Sphere shell

Let $u$ be a direction sampled uniformly from the unit sphere $\mathbb S^2=\{x\in\mathbb R^3:\lVert x\rVert_2=1\}$. Let $\rho$ be a radius. The raw sphere point is

$$
g_{\mathrm{sphere}}(u,\rho)=\rho u,
\qquad u\in\mathbb S^2\subset\mathbb R^3.
$$

The positive class uses a smaller radius than the negative class:

$$
Q_1:\rho\approx r_1,
\qquad Q_0:\rho\approx r_0,
\qquad r_1<r_0,
$$

with $r_1=0.30$ and $r_0=0.85$. Thus `country` is encoded by an inner versus outer shell, not by direction.

### 1.3 Helix tube

Let $t\in[0,T]$ be a position along the helix and $\beta$ its vertical pitch. The centerline is

$$
c(t)=\begin{bmatrix}\cos t\\\sin t\\\beta(t-T/2)\end{bmatrix}.
$$

Two local cross-section directions around that centerline are

$$
n_1(t)=\begin{bmatrix}\cos t\\\sin t\\0\end{bmatrix},
\qquad
n_2(t)=\frac{1}{\sqrt{1+\beta^2}}\begin{bmatrix}-\beta\sin t\\\beta\cos t\\-1\end{bmatrix}.
$$

With cross-section angle $\varphi\in[0,2\pi]$ and tube radius $\rho$, a point in the tube is

$$
g_{\mathrm{helix}}(t,\rho,\varphi)=c(t)+\rho\left(\cos\varphi\,n_1(t)+\sin\varphi\,n_2(t)\right).
$$

The class-conditional distributions are

$$
\begin{aligned}
Q_1:&\quad t\sim\operatorname{Unif}[0,T],\quad\varphi\sim\operatorname{Unif}[0,2\pi],\quad\rho\approx r_1,\\
Q_0:&\quad t\sim\operatorname{Unif}[0,T],\quad\varphi\sim\operatorname{Unif}[0,2\pi],\quad\rho\approx r_0,\quad r_1<r_0.
\end{aligned}
$$

I use $\beta=0.12$, $r_1=0.15$, and $r_0=1.00$. Both classes trace the same curved scaffold. I tried three turns, but the tail layer did not reliably read them under the remaining constraints; one turn was learnable, usable, and testable.

### 1.4 Sampled distribution

Paste the following into a **Custom Iframe Widget** in the LessWrong Docs editor. It loads the public data and fallback images from `phusroyal.github.io`.

```html
<iframe src="https://phusroyal.github.io/embeds/q3-manifold-sampler/" title="Interactive sphere-shell and helix-tube manifold sampler" style="border:0;display:block;height:310px;max-width:100%;width:100%" loading="lazy"></iframe>
```

### 1.5 Normalization

The sphere and helix have different natural scales, so I normalize sampled points to test shape rather than raw norm. Let $g(\eta)$ be a raw point, with $\eta=(u,\rho)$ for the sphere and $\eta=(t,\rho,\varphi)$ for the helix. With balanced classes,

$$
\sigma_{\mathcal G}=\sqrt{\mathbb E[\lVert g(\eta)\rVert_2^2]},
\qquad
z=\frac{g(\eta)}{\sigma_{\mathcal G}}.
$$

For the sphere shell,

$$
\sigma_{\mathrm{sphere}}=\sqrt{\frac12(r_1^2+r_0^2)+\frac{\delta_\rho^2}{12}},
$$

and for the helix tube,

$$
\sigma_{\mathrm{helix}}=\sqrt{1+\frac{\beta^2T^2}{12}+\frac12(r_1^2+r_0^2)+\frac{\delta_\rho^2}{12}}.
$$

Here $\delta_\rho$ is the radius-noise width. Its $\delta_\rho^2/12$ term is the uniform-interval variance [4]. The helix additionally contributes $1$ from its circular core and $\beta^2T^2/12$ from its centered vertical coordinate. Before training, I draw normalized target anchors $\alpha_j^1\sim Q_1$ and $\alpha_j^0\sim Q_0$.

## 2. Train the model

### 2.1 Base classifier

Each text input $x_i$ is encoded by `sentence-transformers/all-MiniLM-L6-v2`, then mean-pooled into $e_i\in\mathbb R^{384}$. A five-layer ReLU MLP maps it to eight logits and is trained with binary cross-entropy:

$$
\mathcal L_{\mathrm{task}}=-\frac1N\sum_{i=1}^N\sum_{f=1}^8\left[y_i^f\log\hat y_i^f+(1-y_i^f)\log(1-\hat y_i^f)\right].
$$

The ordinary classifier reaches mean AUC $0.9884$, mean accuracy $0.9616$, and country AUC $0.9994$. This establishes that later failures come from manifold constraints rather than basic architecture or data handling.

### 2.2 Add the geometry bottleneck and activation-sign

#### 2.2.1 Geometry bottleneck

I reserve three hidden2 preactivations $a_i=(a_{i1},a_{i2},a_{i3})$ for a geometry code $z_i$, leaving 61 complement coordinates $r_i$. Three channels are the minimal space for a point on either target 3D manifold. Because hidden2 is post-ReLU, I add positive offset $b_{\mathcal G}$ so a signed manifold can live in activation space:

$$
h_i^2=[z_i+b_{\mathcal G},r_i].
$$

```html
<iframe src="https://phusroyal.github.io/embeds/q3-three-channel-bottleneck/" title="Interactive three-channel bottleneck diagram" style="border:0;display:block;height:315px;max-width:100%;width:100%" loading="lazy"></iframe>
```

The learned coordinate head $a_\theta(e_i)$ predicts three unconstrained values, and fixed map $G_{\mathcal G}$ converts them into a normalized point on the chosen manifold:

$$
z_i=G_{\mathcal G}(a_\theta(e_i)).
$$

For the sphere bottleneck,

$$
z_i=\frac{\rho_i u_i}{\sigma_{\mathrm{sphere}}},
\qquad
u_i=\begin{bmatrix}
\sqrt{1-v_i^2}\cos\theta_i\\
\sqrt{1-v_i^2}\sin\theta_i\\
v_i
\end{bmatrix},
$$

where $\theta_i=a_{i1}$, $v_i=\tanh(a_{i2})$, and $\rho_i=10^{-3}+R_{\max}\operatorname{sigmoid}(a_{i3})$.

For the helix bottleneck,

$$
z_i=\frac{g_{\mathrm{helix}}(t_i,\rho_i,\varphi_i)}{\sigma_{\mathrm{helix}}},
$$

where $t_i=T\operatorname{sigmoid}(a_{i1})$, $\varphi_i=2\pi\operatorname{sigmoid}(a_{i2})$, and $\rho_i=10^{-3}+R_{\max}\operatorname{sigmoid}(a_{i3})$.

#### 2.2.2 Experiment

At this stage, I optimize only $\mathcal L=\mathcal L_{\mathrm{task}}$.

> *Can the classifier survive this architectural constraint?*

Alongside mean and country AUC, I use four analyses:

1. **Geometry probe.** A fixed readout from $z$ alone measures whether its sphere radius or distance to the helix core is closer to the positive or negative target radius:

   $$
   \operatorname{score}=\gamma(\operatorname{distance\_to\_neg\_radius}^2-\operatorname{distance\_to\_pos\_radius}^2).
   $$

   Its ROC AUC shows whether the reserved code contains the label in the intended geometric form; it does not prove the tail uses that code.

2. **Coverage entropy.** For the sphere, I bin the azimuths of learned points into eight bins. For the helix, I map each point to its nearest core position and bin it into 24 helix positions. High entropy means codes spread across the intended manifold rather than collapsing into one patch.

3. **Causal target delta.** I replace the geometry channels with positive and negative anchors, run the tail, and compute the mean country-logit difference. A large positive value means the tail listens to geometry; a near-zero value means the geometry may look correct but the tail ignores it.

4. **Linear probe AUC.** I train a linear probe on the full country activations. Lower is better: it means country is less exposed as an ordinary linear direction.

#### 2.2.3 Results

*Table 1. Model behavior after adding the geometry bottleneck. Higher is better unless marked ↓.*

| Geometry | Mean task AUC ↑ | Country AUC ↑ | Geometry probe AUC ↑ | Linear probe AUC ↓ | Coverage entropy ↑ | Causal delta ↑ |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Sphere shell | 0.9975 | 0.9995 | 0.2021 | 0.9996 | 0.7971 | 0.0187 |
| Helix tube | 0.9963 | 0.9997 | 0.1182 | 0.9997 | 0.6561 | 0.0357 |

The model survives the bottleneck, but the near-zero causal deltas show that it does not use the intended geometry. Low geometry-probe AUC and coverage entropy also show that country does not yet follow the prescribed shape. The model is routing the label through other complement channels.

### 2.3 Add unconditional optimal-transport coverage

> *Can the learned geometry codes cover the target geometry instead of collapsing to a small region?*

The bottleneck constrains codes to the allowed family, but not to the whole geometry. Every example can lie on a valid helix tube while almost all examples occupy one segment. To prevent this collapse, I add **unconditional mixture optimal transport (MixOT)**, which spreads the unlabeled minibatch across the overall target geometry:

$$
Q_{\mathrm{mix}}=\pi Q_1+(1-\pi)Q_0,
$$

where $\pi$ is the country-positive rate. For minibatch $B$, let $Z_B=\{z_i:i\in B\}$ and sample equally many anchors $A_{\mathrm{mix}}=\{\alpha_1,\ldots,\alpha_n\}$ from $Q_{\mathrm{mix}}$.

Think of learned codes as students and target anchors as seats across the shape. OT matches each student to a seat while every seat must receive a match. Collapsed codes leave distant seats unmatched and are expensive; spread-out codes make the matching cheaper. The pairwise transport cost is

$$
C_{ij}=\lVert z_i-\alpha_j\rVert_2^2.
$$

Entropic OT solves

$$
\operatorname{OT}_{\varepsilon}(Z_B,A_{\mathrm{mix}})=\min_{\Pi}\sum_{i,j}\Pi_{ij}C_{ij}+\varepsilon\sum_{i,j}\Pi_{ij}(\log\Pi_{ij}-1)
$$

subject to

$$
\Pi\mathbf1=\frac1n\mathbf1,
\qquad \Pi^\top\mathbf1=\frac1n\mathbf1.
$$

The second constraint makes collapse expensive because no anchor can be ignored. I use the Sinkhorn formulation for efficient optimization [5]:

$$
\mathcal L=\mathcal L_{\mathrm{task}}+\lambda_{\mathrm{mix}}\operatorname{OT}_{\varepsilon}(Z_B,A_{\mathrm{mix}}).
$$

#### 2.3.1 Results

I add Radius MAE, the mean absolute error between learned and desired class radius (lower is better).

*Table 2. Model behavior after adding unconditional mixture optimal transport.*

| Geometry | Stage | Mean task AUC ↑ | Country AUC ↑ | Geometry probe AUC ↑ | Linear probe AUC ↓ | Coverage entropy ↑ | Causal delta ↑ | Radius MAE ↓ |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Sphere shell | Bottleneck | **0.9975** | **0.9995** | 0.2021 | 0.9996 | 0.7971 | 0.0187 | 0.7243 |
|  | MixOT | 0.9974 | 0.9990 | **0.5585** | **0.9993** | **0.9991** | **0.0206** | **0.3012** |
| Helix tube | Bottleneck | **0.9963** | **0.9997** | 0.1182 | 0.9997 | 0.6561 | 0.0357 | 0.6653 |
|  | MixOT | **0.9975** | 0.9993 | **0.3095** | **0.9994** | **0.9942** | **0.0368** | **0.5582** |

MixOT makes coverage almost perfect, but geometry-probe AUC remains weak, radius MAE remains large, and causal delta remains nearly zero. This is expected: it spreads the unlabeled batch but does not assign positives to $Q_1$ and negatives to $Q_0$.

### 2.4 Add class-conditional geometry

> *Put positive examples in the positive part of the shape, and negative examples in the negative part.*

MixOT spreads the batch but does not assign each class to its own part. I replace its shared seating chart with class-conditional matching and add local per-example signals.

#### 2.4.1 Class-conditional OT (ClassOT)

For $y\in\{0,1\}$, let $Z_y=\{z_i:y_i=y\}$ and sample anchors $A_y$ from $Q_y$. Then

$$
\mathcal L_{\mathrm{class\text{-}OT}}=\frac1M\sum_{y\in\{0,1\}:|Z_y|\ge2}\operatorname{OT}_{\varepsilon}(Z_y,A_y),
$$

where $M$ is the number of included label groups; I skip a class with fewer than two examples in the batch.

#### 2.4.2 Radius loss

ClassOT gives the right distributional shape, but a batch-level match can be weak local training signal. The fixed tail has to decode country from each geometry code. Radius loss supplies a simple cue: each example should reach its own class radius.

Let $\operatorname{rad}_{\mathcal G}(z)$ be distance from the origin for the sphere or distance to the nearest helix core point for the helix:

$$
\mathcal L_{\mathrm{radius}}=\frac1N\sum_i\left(\operatorname{rad}_{\mathcal G}(z_i)-r_{y_i}\right)^2.
$$

#### 2.4.3 Geometry-score loss

Geometry-score loss asks whether the geometry itself would classify a point correctly. Define

$$
d_1(z)=\left(\operatorname{rad}_{\mathcal G}(z)-r_1\right)^2,
\qquad d_0(z)=\left(\operatorname{rad}_{\mathcal G}(z)-r_0\right)^2,
$$

and the logit-like score

$$
s_{\mathrm{geo}}(z)=k(d_0(z)-d_1(z)).
$$

It is high near the positive radius and low near the negative radius, so I optimize

$$
\mathcal L_{\mathrm{geo\text{-}score}}=\frac1N\sum_i\operatorname{BCEWithLogits}(s_{\mathrm{geo}}(z_i),y_i).
$$

#### 2.4.4 Geometry-score loss versus radius loss

ClassOT decides where populations lie. Radius loss asks every point to reach its assigned radius. Geometry-score loss asks whether the radius rule already classifies the point correctly.

For $r_1=0.3$ and $r_0=0.8$, a positive at $0.35$ is good under both losses. A positive at $0.55$ is still pulled toward $0.3$ by radius loss, while geometry-score loss considers it acceptable because it remains closer to $0.3$ than $0.8$. Radius loss controls exact geometry; geometry-score loss is classifier-facing.

#### 2.4.5 Experiment

$$
\mathcal L=\mathcal L_{\mathrm{task}}+\lambda_{\mathrm{class}}\mathcal L_{\mathrm{class\text{-}OT}}+\lambda_{\mathrm{radius}}\mathcal L_{\mathrm{radius}}+\lambda_{\mathrm{geo\text{-}score}}\mathcal L_{\mathrm{geo\text{-}score}}.
$$

*I remove the previous stage's mixture-OT term to test whether class-conditional geometry works on its own.*

#### 2.4.6 Results

*Table 3. Model behavior after replacing unconditional mixture OT with class-conditional OT.*

| Geometry | Stage | Mean task AUC ↑ | Country AUC ↑ | Geometry probe AUC ↑ | Linear probe AUC ↓ | Coverage entropy ↑ | Causal delta ↑ | Radius MAE ↓ |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Sphere shell | Bottleneck | **0.9975** | 0.9995 | 0.2021 | 0.9996 | 0.7971 | 0.0187 | 0.7243 |
|  | MixOT | 0.9974 | 0.9990 | 0.5585 | **0.9993** | **0.9991** | **0.0206** | 0.3012 |
|  | ClassOT | 0.9962 | **0.9996** | **0.9998** | 0.9998 | 0.9970 | 0.0188 | **0.1286** |
| Helix tube | Bottleneck | 0.9963 | **0.9997** | 0.1182 | 0.9997 | 0.6561 | 0.0357 | 0.6653 |
|  | MixOT | **0.9975** | 0.9993 | 0.3095 | **0.9994** | 0.9942 | 0.0368 | 0.5582 |
|  | ClassOT | 0.9949 | 0.9996 | **0.9996** | 0.9997 | **0.9953** | **0.0389** | **0.0974** |

ClassOT writes country into the intended geometry but does not make the classifier read from it. Geometry-probe AUC reaches $0.9998$ for the sphere and $0.9996$ for the helix, but causal delta remains near zero ($0.0188$ and $0.0389$). The tail can still ignore the prescribed geometry and use other hidden2 signals. Near-perfect linear-probe AUC shows that country also remains easy to read linearly.

### 2.5 Make the geometry functional and reduce linear access (GFAL)

> *Can country remain useful while becoming harder to read as one ordinary linear direction?*

I call this combined stage **GFAL**, for **Geometry Functional and Anti-Linear**. It retains the task, ClassOT, radius, and geometry-score losses; restores MixOT coverage; and adds causal geometry pressure, tail fitting, anti-linear pressure, and a squared-correlation penalty.

These additions repair different failures. Causal pressure and tail fitting make the tail respond to the three geometry channels. MixOT protects coverage, especially for the helix. Anti-linear pressure and correlation penalties weaken ordinary linear country readouts from hidden2.

#### 2.5.1 Causal geometry pressure

> *If I replace only the geometry channels, does the model's own country logit move?*

I hold complement $r_i$ fixed and create positive and negative edited states:

$$
h_i^+=[\alpha_i^1+b_{\mathcal G},r_i],\qquad h_i^-=[\alpha_i^0+b_{\mathcal G},r_i].
$$

The target causal response is

$$
\mathcal L_{\mathrm{target\text{-}causal}}=\operatorname{BCEWithLogits}(C_{f^\star}(h_i^+),1)+\operatorname{BCEWithLogits}(C_{f^\star}(h_i^-),0).
$$

I also penalize off-target spillover:

$$
\mathcal L_{\mathrm{spill\text{-}causal}}=\frac1{7N}\sum_i\sum_{f\ne f^\star}\left(C_f(h_i^+)-C_f(h_i^-)\right)^2,
$$

so that

$$
\mathcal L_{\mathrm{causal}}=\mathcal L_{\mathrm{target\text{-}causal}}+0.5\mathcal L_{\mathrm{spill\text{-}causal}}.
$$

Positive geometry should raise the country logit and negative geometry should lower it [6, 7], without moving every other output.

#### 2.5.2 Tail fitting

*hidden2 → hidden3 → logits*

Tail fitting freezes earlier layers and trains only the final tail. It teaches the tail to decode the geometry channels; it does not shape the geometry itself.

There are two distinct failures:

1. **Good geometry, bad use.** The three channels contain the intended structure, but the tail ignores them. Tail fitting gives the decoder a focused reason to read them.
2. **Bad geometry, good reader.** The tail is willing to read the channels, but the channels do not form the desired structure. Tail fitting cannot repair this; geometry losses and causal pressure do that work.

Geometry losses write the code in the right language, causal pressure checks that changing the code changes the answer, and tail fitting teaches the final reader how to read that language.

With $h_i^2=[z_i+b_{\mathcal G},r_i]$, I use:

- **Context state:** $h_i^{\mathrm{ctx}}=[z_i+b_{\mathcal G},\operatorname{stopgrad}(r_i)]$;
- **Neutral state:** $h_i^{\mathrm{neu}}=[z_i+b_{\mathcal G},\operatorname{stopgrad}(\bar r)]$.

The tail predicts $y_i$ from both states and follows the geometry score:

$$
\mathcal L_{\mathrm{tail}}=\mathcal L_{\mathrm{tail}}^{\mathrm{label}}+\mathcal L_{\mathrm{tail}}^{\mathrm{score}},
$$

$$
\mathcal L_{\mathrm{tail}}^{\mathrm{label}}=\frac12\left[\operatorname{BCEWithLogits}(C_{f^\star}(h_i^{\mathrm{ctx}}),y_i)+\operatorname{BCEWithLogits}(C_{f^\star}(h_i^{\mathrm{neu}}),y_i)\right],
$$

$$
\mathcal L_{\mathrm{tail}}^{\mathrm{score}}=\frac12\left[\operatorname{SmoothL1}(C_{f^\star}(h_i^{\mathrm{ctx}}),\operatorname{stopgrad}(s_{\mathrm{geo}}(z_i)))+\operatorname{SmoothL1}(C_{f^\star}(h_i^{\mathrm{neu}}),\operatorname{stopgrad}(s_{\mathrm{geo}}(z_i)))\right].
$$

The stopped geometry score is a fixed teacher signal: the tail moves toward it, rather than changing the score to make the loss easier.

#### 2.5.3 Anti-linear pressure

Even after geometry contains country, the full hidden2 state can expose a simple linear country direction. I add a one-layer adversary

$$
a_\phi(h_i^2)=\sigma(w^\top h_i^2+b)
$$

with loss

$$
\mathcal L_{\mathrm{lin\text{-}adv}}=\frac1N\sum_{i=1}^N\operatorname{BCEWithLogits}(a_\phi(\operatorname{GRL}(h_i^2)),y_i).
$$

Gradient reversal leaves hidden2 unchanged in the forward pass but reverses its gradient in the backward pass. The adversary learns to predict country; the representation learns to make that linear prediction worse. Equivalently,

$$
\min_\theta\max_\phi\quad \mathcal L_{\mathrm{task}}+\lambda_{\mathrm{geom}}\mathcal L_{\mathrm{geom}}-\lambda_{\mathrm{lin}}\mathcal L_{\mathrm{lin\text{-}adv}}(\phi;\theta).
$$

The objective is not to erase country entirely. The main task still needs country and geometry losses still require the first three channels to carry its manifold. It is to remove the arbitrary straight-line shortcut, following the gradient-reversal mechanism of Ganin et al. [8].

#### 2.5.4 Squared correlation penalty

An adversary can underfit or miss one narrow channel that quietly tracks country. I therefore add a direct backup check for every hidden2 channel:

$$
\operatorname{Corr}(h_{\cdot j}^2,\mathbf y)=\frac{\frac1N\sum_i(h_{ij}^2-\bar h_j^2)(y_i-\bar y)}{\operatorname{std}(h_{\cdot j}^2)\operatorname{std}(\mathbf y)},
$$

$$
\mathcal L_{\mathrm{leak}}=\sum_{j=1}^{64}\operatorname{Corr}(h_{\cdot j}^2,\mathbf y)^2.
$$

This does not prove that the complement is clean, but it closes the easy one-channel shortcut.

#### 2.5.5 Experiment

$$
\begin{aligned}
\mathcal L={}&\mathcal L_{\mathrm{task}}\\
&+\lambda_{\mathrm{mix}}\mathcal L_{\mathrm{mix}}+\lambda_{\mathrm{class}}\mathcal L_{\mathrm{class\text{-}OT}}+\lambda_{\mathrm{radius}}\mathcal L_{\mathrm{radius}}+\lambda_{\mathrm{geo\text{-}score}}\mathcal L_{\mathrm{geo\text{-}score}} &&\text{geometry}\\
&+\lambda_{\mathrm{causal}}\mathcal L_{\mathrm{causal}}+\lambda_{\mathrm{tail}}\mathcal L_{\mathrm{tail}} &&\text{causal use}\\
&+\lambda_{\mathrm{lin\text{-}adv}}\mathcal L_{\mathrm{lin\text{-}adv}}+\lambda_{\mathrm{leak}}\mathcal L_{\mathrm{leak}} &&\text{shortcut reduction.}
\end{aligned}
$$

#### 2.5.6 Results

*Table 4. Model behavior after adding causal geometry pressure, tail fitting, anti-linear pressure, and squared correlation penalty (GFAL: Geometry Functional and Anti-Linear).* 

| Geometry | Stage | Mean task AUC ↑ | Country AUC ↑ | Geometry probe AUC ↑ | Linear probe AUC ↓ | Coverage entropy ↑ | Causal delta ↑ | Radius MAE ↓ |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Sphere shell | Bottleneck | **0.9975** | 0.9995 | 0.2021 | 0.9996 | 0.7971 | 0.0187 | 0.7243 |
|  | MixOT | 0.9974 | 0.9990 | 0.5585 | 0.9993 | 0.9991 | 0.0206 | 0.3012 |
|  | ClassOT | 0.9962 | **0.9996** | **0.9998** | 0.9998 | 0.9970 | 0.0188 | **0.1286** |
|  | GFAL | 0.9799 | 0.9995 | 0.9997 | **0.5743** | **0.9993** | **3.0845** | 0.1444 |
| Helix tube | Bottleneck | 0.9963 | **0.9997** | 0.1182 | 0.9997 | 0.6561 | 0.0357 | 0.6653 |
|  | MixOT | **0.9975** | 0.9993 | 0.3095 | 0.9994 | 0.9942 | 0.0368 | 0.5582 |
|  | ClassOT | 0.9949 | 0.9996 | **0.9996** | 0.9997 | **0.9953** | 0.0389 | **0.0974** |
|  | GFAL | 0.9739 | 0.9957 | 0.9940 | **0.6710** | 0.7510 | **1.8980** | 0.1887 |

GFAL makes the geometry functional. Geometry-probe AUC stays at $0.9997$ for the sphere and $0.9940$ for the helix, while causal delta rises from near zero to $3.0845$ and $1.8980$. Geometry edits now move the model's country logit.

Linear-probe AUC falls from $0.9998/0.9997$ in the ClassOT stage to $0.5743/0.6710$. The sphere result is cleaner; the helix retains lower coverage and higher linear access, so MixOT remains necessary.

```html
<iframe src="https://phusroyal.github.io/embeds/q3-loss-routing/" title="Interactive GFAL loss-routing diagram" style="border:0;display:block;height:270px;max-width:100%;width:100%" loading="lazy"></iframe>
```

### 2.6 Reduce complement shortcuts

GFAL makes geometry functional, but does not prove the remaining 61 channels are harmless.

> *If I remove geometry code $z_i$ and look only at the remaining 61 $r_i$ channels, can I still read country?*

If yes, geometry is functional but not primary: the model has a backup route. GFAL+ adds a second one-layer adversary $c_\psi(r_i)$:

$$
\mathcal L_{\mathrm{comp\text{-}adv}}=\frac1N\sum_{i=1}^N\operatorname{BCEWithLogits}(c_\psi(\operatorname{GRL}(r_i)),y_i),
$$

or, in probability form,

$$
\mathcal L_{\mathrm{comp\text{-}adv}}=-\frac1N\sum_{i=1}^N\left[y_i\log\sigma(c_\psi(r_i))+(1-y_i)\log(1-\sigma(c_\psi(r_i)))\right].
$$

I also use

$$
\mathcal L_{\mathrm{comp\text{-}leak}}=\sum_{k=1}^{61}\operatorname{Corr}(r_{\cdot k},\mathbf y)^2.
$$

#### 2.6.1 Why keep both anti-linear and complement adversaries?

Complement cleanup is narrower: it only asks whether country can be read after removing geometry. The anti-linear adversary asks whether country remains easy to read linearly from the full hidden2 state, which includes both $z_i+b_{\mathcal G}$ and $r_i$. Without full-hidden2 pressure, the model can reopen a linear shortcut using their mixture.

The squared correlation penalty remains a separate guardrail. An adversary depends on optimization; correlation directly targets the simpler failure in which one channel tracks country. This stage adds complement-specific pressure without declaring the earlier shortcut solved forever.

#### 2.6.2 Experiment

$$
\mathcal L_{\mathrm{GFAL+}}=\mathcal L_{\mathrm{GFAL}}+\lambda_{\mathrm{comp\text{-}adv}}\mathcal L_{\mathrm{comp\text{-}adv}}+\lambda_{\mathrm{comp\text{-}leak}}\mathcal L_{\mathrm{comp\text{-}leak}}.
$$

#### 2.6.3 Results

*Table 5. Model behavior after adding complement-adversary pressure (GFAL+).* 

| Geometry | Stage | Mean task AUC ↑ | Country AUC ↑ | Geometry probe AUC ↑ | Linear probe AUC ↓ | Coverage entropy ↑ | Causal delta ↑ | Radius MAE ↓ | Complement AUC ↓ |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Sphere shell | Bottleneck | **0.9975** | 0.9995 | 0.2021 | 0.9996 | 0.7971 | 0.0187 | 0.7243 | 0.9996 |
|  | MixOT | 0.9974 | 0.9990 | 0.5585 | 0.9993 | 0.9991 | 0.0206 | 0.3012 | 0.9981 |
|  | ClassOT | 0.9962 | 0.9996 | **0.9998** | 0.9998 | 0.9970 | 0.0188 | 0.1286 | 0.9998 |
|  | GFAL | 0.9799 | 0.9995 | 0.9997 | **0.5743** | 0.9993 | 3.0845 | 0.1444 | 0.5758 |
|  | GFAL+ | 0.9674 | **0.9996** | 0.9997 | 0.6204 | **0.9997** | **3.5004** | **0.1171** | **0.5728** |
| Helix tube | Bottleneck | 0.9963 | **0.9997** | 0.1182 | 0.9997 | 0.6561 | 0.0357 | 0.6653 | 0.9997 |
|  | MixOT | **0.9975** | 0.9993 | 0.3095 | 0.9994 | 0.9942 | 0.0368 | 0.5582 | 0.9994 |
|  | ClassOT | 0.9949 | 0.9996 | **0.9996** | 0.9997 | **0.9953** | 0.0389 | **0.0974** | 0.9996 |
|  | GFAL | 0.9739 | 0.9957 | 0.9940 | 0.6710 | 0.7510 | 1.8980 | 0.1887 | 0.6071 |
|  | GFAL+ | 0.9576 | 0.9949 | 0.9927 | **0.5992** | 0.7787 | **2.6884** | 0.2111 | **0.5681** |

```html
<iframe src="https://phusroyal.github.io/embeds/q3-constraint-ladder/" title="Interactive constraint-ladder chart" style="border:0;display:block;height:410px;max-width:100%;width:100%" loading="lazy"></iframe>
```

```html
<iframe src="https://phusroyal.github.io/embeds/q3-final-codes/" title="Interactive final manifold codes" style="border:0;display:block;height:285px;max-width:100%;width:100%" loading="lazy"></iframe>
```

GFAL+ preserves task performance, strong geometry probes, and causal geometry for both manifolds. Its complement result is asymmetric: complement AUC falls from $0.6030$ to $0.5661$ for the helix but rises from $0.5764$ to $0.6086$ for the sphere. Thus it reduces a helix backup route but does not establish perfect information isolation for either geometry.

## 3. Causal-use validation

> *If I edit only the geometry channels after training, does the trained classifier actually follow that edit?*

The earlier probes show that geometry channels contain country information; they do not show that the classifier uses them. I freeze the model, select a balanced held-out subset, and edit only hidden2 geometry channels. I use four interventions:

1. **Ablation:** set $z_i$ to zero and ask whether country prediction worsens.
2. **Replacement:** insert positive or negative anchors and ask whether the country logit follows.
3. **Swap:** exchange learned geometry codes between labels and ask whether predictions move as expected.
4. **Path:** move smoothly from positive to negative geometry and ask whether the country logit moves smoothly.

For replacement and swap, I also measure **specificity**: whether country moves much more than the other seven logits.

### 3.1 Ablation

I replace $z_i$ with zero, then compute target AUC. The ablation drop is

$$
\operatorname{AUC}_{\mathrm{base}}-\operatorname{AUC}_{\mathrm{ablated}}.
$$

### 3.2 Replacement

I replace learned geometry with positive or negative anchors while preserving the original complement:

$$
h_i^2\to\tilde h_i^2=[\alpha_i^1+b_{\mathcal G},r_i],
\qquad\text{or}\qquad
h_i^2\to\tilde h_i^2=[\alpha_i^0+b_{\mathcal G},r_i].
$$

The causal target delta is

$$
\Delta_{\mathrm{target}}=\frac1N\sum_i\left[C_{f^\star}([\alpha_i^1+b_{\mathcal G},r_i])-C_{f^\star}([\alpha_i^0+b_{\mathcal G},r_i])\right].
$$

### 3.3 Swap

For positive-negative pairs $(p_j,n_j)$, I exchange only their geometry channels:

$$
\tilde h_{p_j}^2=[z_{n_j}+b_{\mathcal G},r_{p_j}],
\qquad
\tilde h_{n_j}^2=[z_{p_j}+b_{\mathcal G},r_{n_j}].
$$

The swap target shift is

$$
\Delta_{\mathrm{swap}}=\frac1{2m}\sum_{j=1}^m\left[C_{f^\star}(h_{p_j}^2)-C_{f^\star}(\tilde h_{p_j}^2)+C_{f^\star}(\tilde h_{n_j}^2)-C_{f^\star}(h_{n_j}^2)\right].
$$

It is large when negative geometry lowers positive examples and positive geometry raises negative examples.

### 3.4 Path

I choose a deterministic path through each target geometry from the positive to the negative radius:

$$
z^{(1)},z^{(2)},\ldots,z^{(K)}.
$$

Rather than jumping directly between the endpoints, I traverse intermediate geometry points and check whether the country logit changes smoothly. For the sphere, I fix one direction and increase radius from $r_1$ to $r_0$. For the helix, I fix one core position and tube angle, then increase only the tube radius. I hold the complement at mean $\bar r$:

$$
h^{(k)}=[z^{(k)}+b_{\mathcal G},\bar r].
$$

If $\ell_k=C_{f^\star}(h^{(k)})$, expected country logit movement is downward:

$$
\Delta_{\mathrm{path}}=\ell_1-\ell_K,
$$

$$
M_{\mathrm{path}}=\frac1{K-1}\sum_{k=1}^{K-1}\mathbf1[\ell_k-\ell_{k+1}>0].
$$

$M_{\mathrm{path}}=1$ means every adjacent step moves in the expected direction.

### 3.5 Specificity

Specificity compares country movement with average off-target movement:

$$
\operatorname{specificity}=\frac{|\Delta_{\mathrm{target}}|}{\frac1{7N}\sum_i\sum_{f\ne f^\star}|C_f([\alpha_i^1+b_{\mathcal G},r_i])-C_f([\alpha_i^0+b_{\mathcal G},r_i])|}.
$$

A high ratio means the geometry edit mainly affects country rather than every feature.

### 3.6 Results

*Table 6. Causal-use validation on the trained model from the previous stage.*

| Geometry | Ablation AUC drop | Ablation target AUC | Causal delta | Swap target shift | Swap specificity | Path target delta | Path monotonic fraction | Specificity ratio |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Sphere shell | 0.4675 | 0.5317 | 3.5004 | 4.4433 | 92.0223 | 3.4963 | 1.0000 | 73.4252 |
| Helix tube | 0.4279 | 0.5654 | 2.6884 | 7.1863 | 128.0430 | 5.1727 | 1.0000 | 47.3151 |

```html
<iframe src="https://phusroyal.github.io/embeds/q3-causal-validation/" title="Interactive causal-use validation" style="border:0;display:block;height:490px;max-width:100%;width:100%" loading="lazy"></iframe>
```

Both geometries pass every causal check. Ablation nearly removes country prediction, leaving both near chance. Replacement moves country logits in the expected direction with specificity ratios $73.4252$ and $47.3151$. Each path has monotonic fraction $1.0000$.

The swap test is the strongest learned-code check because it exchanges the model's own geometry codes rather than synthetic anchors. It yields target shifts $4.4433$ for the sphere and $7.1863$ for the helix, with specificities $92.0223$ and $128.0430$. The learned geometry is therefore not merely visually aligned with country: moving it between examples changes the model's prediction path as expected.

The sphere is geometrically cleaner, with higher coverage entropy and lower radius MAE, but both geometries show strong causal use. These tests establish a causally active pathway, not perfect information isolation: the complement can remain an alternative country-information source.

## Conclusion

This experiment shows that a small MLP can encode a semantic feature through a pre-chosen nonlinear manifold in only three channels while preserving task performance. A sphere shell and helix tube both support a code that is geometrically well formed and causally used by the classifier.

The result is not that `country` has been isolated perfectly. GFAL+ leaves evidence of complement leakage, and the helix is a harder geometry to maintain than the sphere. The useful conclusion is narrower: geometry can be specified before training, made readable from a compact code, and tested causally rather than accepted because it looks interpretable.

## References

1. Gurnee et al. [*When Models Manipulate Manifolds: The Geometry of a Counting Task*](https://arxiv.org/abs/2601.04480).
2. Wurgaft et al. [*Manifold Steering Reveals the Shared Geometry of Neural Network Representation and Behavior*](https://arxiv.org/abs/2605.05115).
3. Tolstikhin et al. [*Wasserstein Auto-Encoders*](https://arxiv.org/abs/1711.01558).
4. ProofWiki. [*Variance of Continuous Uniform Distribution*](https://proofwiki.org/wiki/Variance_of_Continuous_Uniform_Distribution).
5. Cuturi. [*Sinkhorn Distances: Lightspeed Computation of Optimal Transportation Distances*](https://arxiv.org/abs/1306.0895).
6. Geiger et al. [*Inducing Causal Structure for Interpretable Neural Networks*](https://proceedings.mlr.press/v162/geiger22a.html).
7. Geiger et al. [*Causal Abstractions of Neural Networks*](https://arxiv.org/abs/2106.02997).
8. Ganin et al. [*Domain-Adversarial Training of Neural Networks*](https://arxiv.org/abs/1505.07818).
