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
    - this is first article of my series of articles on BlueDot's Technical AI Safety Puzzle #1.
    - `Train a new model with a more interesting representation.` to link of q3


Designs:
- Figure text is clickable. `From both Table 5 and Figure 4, ...` -> `From both [Table 5](#table-5) and [Figure 4](#figure-4), ...`
- Axis labels must be evenly spaced and aligned with the ticks. `x-axis` and `y-axis` labels should be centered with respect to the axis.
- Make the inline citation jump to corresponding citation in references 
- Make the citation when I hover it show a box of corresponding citation
- when → is used in the text as a new line, it should be displayed in a new line but also not too far from the previous line. It should be aligned with the previous line. Pulled standalone arrow notes closer to the preceding paragraph by overriding the default paragraph gap
- Replaced all norm notation with explicit KaTeX double-bar delimiters