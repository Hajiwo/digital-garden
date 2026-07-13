---
title: "The flavor of the bitter lesson for computer vision"
description: Notes on building a personal knowledge system that invites return.
date: 2026-07-15
original_link: "https://www.vincentsitzmann.com/blog/bitter_lesson_of_cv/"
category: Knowledge Design
published: 2026-02-01
tags:
  - clippings, computer vision
---

[![Portrait of Vincent Sitzmann](https://www.vincentsitzmann.com/_astro/vincent.Dvoy81k6_1n4HGu.avif,%20/_astro/vincent.Dvoy81k6_1n4HGu.avif)](https://www.vincentsitzmann.com/)

I believe that computer vision as we know it is about to go away.

Historically, we have treated vision as a mapping from images to intermediate representations—classes, segmentation masks, or 3D reconstructions. But in the era of the Bitter Lesson, these distinct tasks are becoming qualitatively no different than edge detection: historical artifacts of scoping “solvable intermediate problems” rather than solving intelligence.

While the “LLM moment” in NLP clarified that language modeling is the ultimate objective, the vision community is still debating the flavor of its own revolution. We continue to fine-tune models for specific tasks like point tracking, segmentation, or 3D reconstruction—even as world models emerge, skirt all conventional intermediate representations, and directly solve a problem dramatically more general than everything our community has tackled in the past.

In this post, I argue that the future of computer vision is as part of end-to-end perception-action loops. The historical boundaries between computer vision, robot learning, and control will dissolve. Frontier research will no longer draw a boundary between “seeing” and “learning to act.”

As a special case, I will discuss the waning importance of 3D representations: I predict that just as we no longer hand-craft features for detection, we will soon stop using 3D as part of embodied intelligence.

## How we arrived at today’s scope of computer vision

To understand where the field is going, it is instructive to ask what vision actually *is*.

Historically, we have treated vision as the “visual perception” sub-module of intelligence—often summarized as “knowing what is where.” However, this is not a well-defined task. It does not specify a strictly falsifiable input-output behavior: The inputs are images or video, sure—but what are the outputs? Consequently, it does not lend itself to being definitively “solved.”

In the real world, there is a much clearer metric for perception: intelligent action. An agent has succeeded at perceiving the world when it can map present and past percepts to actions that accomplish its goals, especially when exposed to new and unseen environments. This is easily falsifiable: I want to be able to demonstrate a task to my robot such as cleaning out the dishwasher, and I expect the robot to succeed at this task. If it succeeded, it clearly perceived what was important.

Why, then, did we not start there? In the past, learning perception-action loops directly was intractable. Because the role of a scientist is to work on the solvable, we split off computer vision. The community converged on a niche of building algorithms that map images to intermediate representations that appeared practically useful—classification, segmentation, optical flow, 3D reconstruction, and SLAM.

Simultaneously, robot learning and control were scoped as the study of algorithms that ingest these specific representations—point clouds, bounding boxes, and masks—and map them to actions.

This factorization was a necessary compromise for the time. However, I believe this “modular” model of embodied intelligence is quickly losing its raison d’être.

## Case study: How 3D may become obsolete for training embodied intelligence models

Rich Sutton’s Bitter Lesson states: “General methods leveraging massive computation… consistently outperform human-crafted, task-specific systems, even though the latter feel clever initially.”

In computer vision, most researchers readily apply this lesson to algorithms, acknowledging that neural networks with physical inductive biases are rarely scalable. Yet, surprisingly few apply the same logic to representations.

Take the very notion of a 3D representation, be it a point cloud, a radiance field, a signed distance function, or a voxel grid. Consider the fundamental loop of embodied intelligence: perception in, action out. In a world where we can train end-to-end algorithms to tackle this behavior directly, hand-crafting an explicit intermediate representation like “3D structure” becomes exactly the kind of clever, human-designed bottleneck that the Bitter Lesson warns against.

To see why, try a thought experiment. Look at the room you are currently sitting in. If I gave you a perfect 3D reconstruction of this scene—a NeRF, a point cloud, whatever you choose—what real problem would you be able to solve with it?

There are of course niche applications such as novel view synthesis. But for any task involving embodied intelligence, you still need a separate, intelligent algorithm to ingest that 3D representation and decide what to do. The overall input-output behavior remains images to actions, reducing the 3D reconstruction to a clever pre-processing step. In the long arc of embodied intelligence, this factorization will not pass the test of time.

In fact, many tasks traditionally thought to rely on 3D are already being solved better by end-to-end learning. Take novel view synthesis: the state-of-the-art in few-shot view synthesis has for a while now not employed 3D differentiable rendering, but lies with generative world models. When my students Boyuan and Kiwhan developed [History-Guided Video Diffusion](https://www.boyuan.space/history-guidance/), they generated novel views of RealEstate10k that looked far better than any 3D-structured algorithm I had ever worked on—and they did so almost as an afterthought.

## SE(3) Camera Poses Will Go, Too

You might argue that these generative models are still conditioned on camera poses, obtained via conventional multi-view geometry (COLMAP) or learned equivalents. However, I predict that just like 3D representations, algorithms that output camera poses will also become obsolete. My lab has already shown that [novel view synthesis can be formalized purely as a representation learning problem](https://www.mitchel.computer/xfactor/) —without any concepts from multi-view geometry. No poses, no 3D.

Ego-motion (and therefore camera pose) is simply the most basic action an agent can take. It is not special. Ultimately, we must solve the problem of an AI controlling a body it has never inhabited before. In that context, inferring ego-motion is trivial compared to the complex control problems a general-purpose agent must solve. Whatever algorithm we converge on will handle ego-motion implicitly, without needing us to bake it in.

## To get models competent at 3D editing, don’t train them for 3D editing

What about engineering tasks such as architecture, CAD, or manufacturing? Surely, we need explicit 3D representations to build a house or 3D-print an engine part. I agree that for the *human-machine interface*, having a 3D mesh representation and a CAD-like editor may be reasonable. However, my argument is not about how we talk to the machine, but how we train models that will ultimately help us automate 3D design tasks.

Here, again, to obtain models that are maximally competent at assisting with the manipulation of both physical and digital 3D objects, we should not train them to explicitly produce expert-crafted 3D representations, nor bake such representations into their architectures. Instead, our goal should be to train general-purpose physical intelligence models directly on raw data, allowing them to learn their own internal, task-relevant structure. These internal representations need not—and likely will not—correspond to any human-designed notion of 3D blocking, meshing, or reconstruction. Only after such a model has been trained should it be fine-tuned to interface with whatever representation or toolchain we humans like to use.

As for the final step—manufacturing the artifact—in the near term, we will similarly fine-tune models on 3D printer APIs or mesh file formats. In the very long run, I note that a 3D printer or excavator is essentially a robot: A physical machine that we seek to automate via AI. Hence, I find it plausible that we will eventually solve these challenges of 3D manufacturing in the same way in which we will solve embodied intelligence more generally, by yielding direct control of the actuators of the machine to the AI.

## The key challenge of perception-action loops and world models

The core challenge of embodied intelligence is the lack of paired perception–action data at scale. Deploying large numbers of robots in the real world is extremely expensive, and even if we could do so, it remains unclear what we would have them do. Collecting valuable data requires agents to perform meaningful, diverse behaviors. Today, this is largely achieved through teleoperation. This works remarkably well for self-driving—humans already drive cars, but it scales far less naturally to humanoid robots with dexterous hands.

The long-term goal is robots that collect data autonomously, driven by intrinsic motivation—much like toddlers. While this concept of “intrinsic reward” has a rich history in the RL community, current algorithms are far too sample-inefficient to be deployed on real robots. Moreover, unleashing large numbers of agents with essentially random policies into the physical world, where they can hurt themselvs and others, is simply not viable.

This, then, is the central question facing embodied intelligence today: how do we move toward closing the perception–action loop without having direct access to large-scale action data?

This is where world models enter the picture. On the surface, they may appear to be just another intermediate task—learned simulators that do not themselves address the core challenge. And indeed, on their own, they do not.

They do, however, offer two promising angles.

First, video (and potentially audio) generative modeling provides a clearly scalable pre-training objective. Crucially, video does not merely capture raw sensory data—it also implicitly encodes a vast amount of information about not only physics and how the world works, but also human knowledge about skills, tasks, and their structure. Training a finite neural network to approximate this complex process could lead to useful representations that could hopefully be used as a basis to be fine-tuned into policies with useful know-how. However, this remains speculative: to date, I am not aware of any clear demonstration that video models can easily be fine-tuned into policies, though there are some early signs of life.

Second, by extending video models to be action-conditional, they can serve as simulators in which agents can be trained. In principle, this enables a form of data amplification: expensive real-world interactions can be used to bootstrap a model that supports much richer virtual experience. At the same time, this approach exposes a fundamental chicken-and-egg problem. Training interactive world models requires paired action–observation data, which is precisely the resource we lack-excepting, again, self-driving, where such data is plenty. Unsurprisingly, existing systems exhibit only limited forms of interactivity, often reminiscent of video games, which likely made up a significant part of their training data.

For these reasons, I do not believe that video generative models will solve embodied intelligence. They may not even be a necessary component of the final solution. Rather, they should be seen as one of several early attempts at identifying a scalable pre-training objective for perception–action learning. At present, however, there is no clear answer to what the “right” pre-training task should be. The same is true for many of the other ingredients required to close the perception–action loop. Questions of intrinsic motivation, exploration, long-horizon memory, continual learning, and real-time control with large models remain wide open.

However, nevertheless, things have changed: I believe that we are now at a time where tackling these questions head-on is viable. This, then, is the central point of this article: A call to abandon the conventional boundaries between computer vision and robot learning, and instead ponder the problems that arise when we seek to build machines that both perceive *and* act.

**Acknowledgements** Thanks to David Charatan, Hyunwoo Ryu, Ana Dodik, and Lester Li for considerable feedback and copy-editing.

## Further Reading

- [A great interview with Danijar Hafner on world models](https://www.youtube.com/watch?v=OzVC6pT2TBI)
- [Ross Girshick’s “Parable of the Parser”](https://drive.google.com/file/d/1VodGljuEhBKwZIXQwN-ApH6g2wBAVAdK/view) discusses how there were many “fake tasks” in NLP, such as syntax parsing, and how they essentially became obsolete when LLMs simply solved the overall problem. I argue that the “overall problem” of vision is and has always been embodied intelligence.
- [Jon Barron’s recent talk](https://www.youtube.com/watch?v=hFlF33JZbA0) discusses radiance fields in the age of video models, and points to the obsolecense of 3D as well.
- [Dreamer v1, v2, v3, v4](https://danijar.com/) – some of the first work that got world models “to work” and proposed how we might use them to obtain perception-action loops by Danijar Hafner.
- [Some of Schmidhuber’s thinking on World Models](https://arxiv.org/pdf/1511.09249)
- [Neural Scene Representation and Rendering, Eslami et al.](https://arkitus.com/files/science-18-gqn-preprint.pdf) – work that inspired me early on.

## My group’s work in this space

- [My talk about “Modeling the World (and yourself) from vision”](https://www.youtube.com/watch?v=B3digzhanUY)
- [Diffusion Forcing](https://boyuan.space/diffusion-forcing/) and [History-Guided Video Diffusion](https://www.boyuan.space/history-guidance/) that first showed stable auto-regressive rollout with diffusion and the potential to simulate video games—used to train the [Oasis model](https://oasis-model.github.io/) and many other mainstream world models today.
- [“True Self-Supervised Novel View Synthesis is Transferable”](https://www.mitchel.computer/xfactor/) which defines novel view synthesis without relying on any concepts from conventional multi-view geometry, can be seen as a “latent action model” in which “camera poses” and “ego motion” are really no different from any other action that may occur between video frames.
- Our paper [“Large Video Planner”](https://www.boyuan.space/large-video-planner/) which demonstrates that video generative models are useful to robotics already today, by generating “video plans” of solving a variety of tasks, though lots of challenges remain: how do we extract policies from these videos?
- [Generative View Stitching](https://andrewsonga.github.io/gvs/), a way of generating long videos with short-context video models such that the video is consistent with a pre-defined camera trajectory.
- More to come on our [group website](https://scenerepresentations.org/)