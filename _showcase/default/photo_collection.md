---
show: true
width: 4
date: 2100-09-12 00:01:00 +0800
height: 295px
images:
- src: assets/images/photos/mbz/DSC04226.JPG
  # title: Photo 1
  desc: Shot at MBZUAI
- src: https://picsum.photos/seed/second22/800/800
  title: Photo 2
  desc: Description 2
- src: https://picsum.photos/seed/third33/800/800
---

{% include widgets/carousel.html id=page.id images=page.images height=page.height %}
