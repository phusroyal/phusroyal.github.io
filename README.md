Hi I am Phu Gia Hoang. See more here for the template: https://github.com/luost26/academic-homepage 

To build: bundle exec jekyll serve 
To fetch citations: python scripts/update_google_scholar_citations.py


Interactive template:
- example: https://tmlr-beyond-pdf.org/under_review/submission/
- about: https://tmlr-beyond-pdf.org/about
- Local reuse: [Research Note Demo](http://127.0.0.1:4000/writing/research-note-demo/)


Inspirations:
- https://onethousandwu.com/
    - nice showcase
    - nice paper tags, pages

- https://yqxie99.github.io/publications
    - num citation

- https://shiwonkim.github.io/research
    - blog and pub in the same page

- when blogs become a big thing:
    - https://harrisbio.substack.com/ : substack

Todos:
- copiable bibtex
- arxiv / github icon for each paper
- remove vihos page
- arrow in research page is not aligned with the text
- try `shorter research-note version that moves derivations into expandable sections`
- anti software overvalidation
- q12
    - add repo
    - this is first article of my series of articles on BlueDot's Technical AI Safety Puzzle #1.
    - `Train a new model with a more interesting representation.` to link of q3
- update https://github.com/phusroyal/Phu-BlueDot_1st_puzzle readme

Designs:
- add stable anchors to every table and figure, then turn each in-text Table N and Figure N reference into a fragment link so normal browser back navigation returns readers to their prior position.
- Axis labels must be evenly spaced and aligned with the ticks. `x-axis` and `y-axis` labels should be centered with respect to the axis.
- Make the inline citation jump to corresponding citation in references 
- Make the citation when I hover it show a box of corresponding citation
- when → is used in the text as a new line, it should be displayed in a new line but also not too far from the previous line. It should be aligned with the previous line. Pulled standalone arrow notes closer to the preceding paragraph by overriding the default paragraph gap
- Replaced all norm notation with explicit KaTeX double-bar delimiters
- Section references should be clickable and jump to the corresponding section. When clicked, the page should scroll to the section and highlight it for a few seconds.

Maths:
- Use \lbrace/\rbrace for { and } in inline math.
- Use \lVert … \rVert rather than escaped pipes for norms in inline math.





no edits, lets discuss how to fix your visualizations of `residual_lowD`. Please look at reference in `.JMLR/figures/cards/residual_lowD_k.png`:
  - in 2d class view, in the reference it fits some planes for data and different planes seems own different colors. these colors also match with the colors of the points in the 3d ball view.

although this is nice (the ref fig). im really skeptical about the truthfulness of the data projection.

I want to do this but still truthfully represent the data projection. 