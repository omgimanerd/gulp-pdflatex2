\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{math}[2016/12/06 Custom Math Notes]
\LoadClass[letterpaper, 12pt]{article}

\renewcommand*{\arcsin}{\sin^{-1}}
\renewcommand*{\arccos}{\cos^{-1}}
\renewcommand*{\arctan}{\tan^{-1}}
\newcommand*{\arccot}{\cot^{-1}}
\newcommand*{\arcsec}{\sec^{-1}}
\newcommand*{\arccsc}{\csc^{-1}}
\newcommand*{\diff}{\mathrm{d}}
\newcommand*{\ddiff}[2]{\frac{\diff{#1}}{\diff{#2}}}
\newcommand*{\Diff}[1]{\mathrm{d^#1}}
\newcommand*{\e}{\mathrm{e}}
\newcommand*{\N}{\mathbb{N}}
\newcommand*{\R}{\mathbb{R}}
\newcommand*{\Z}{\mathbb{Z}}
\newcommand*{\Qp}{\mathbb{Q'}}
\newcommand*{\nPr}[2]{_{#1}P_{#2}}
\newcommand*{\nPrf}[2]{\frac{#1!}{(#1-#2)!}}
\newcommand*{\nCr}[2]{_{#1}C_{#2}}
\newcommand*{\nCrf}[2]{\frac{#1!}{(#1-#2)!#2!}}
