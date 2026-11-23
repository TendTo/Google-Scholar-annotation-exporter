Export your Google Scholar PDF Reader annotations (highlights and notes) to JSON, CSV, LaTeX, Markdown, or custom format.

This extension is open source. Feel free to explore the source code at https://github.com/TendTo/Google-Scholar-annotation-exporter. 

Installation

- Install the Google Scholar PDF Reader extension.
- Install the Google Scholar annotation exporter extension.
- Open a PDF in Google Scholar PDF Reader, click the "Export annotations" button in the toolbar, and choose your preferred export format (JSON, CSV or Markdown).

Output format

The exported annotations will be saved in the chosen format with the following structure:

JSON
{
  "extension": "Google Scholar annotation exporter",
  "extensionHomepage": "https://chromewebstore.google.com/detail/google-scholar-annotation/dkcipnihgbegpammhgkobheodoknplma",
  "extensionVersion": "1.0.0",
  "exportDate": "2023-01-01T12:00:00Z",
  "numberOfPapers": 1,
  "numberOfAnnotations": 2,
  "version": "1.0",
  "papers": [
    {
      "error": "",
      "captcha": false,
      "citation": "Author 1, Author 2, 2023. Paper Title. Journal Name.",
      "metadata": ["Author 1, Author 2", "Journal Name, 2023"],
      "title": "Paper Title",
      "authors": "Author 1, Author 2",
      "journal": "Journal Name",
      "year": "2023",
      "link": "https://link.to.paper.pdf",
      "annotations": [
        {
          "highlightText": "indeed.",
          "note": "This is a note for the highlighted text.",
          "highlightColor": "Purple",
          "page": 1,
          "context": "This is the context of the highlighted text indeed."
        },
        {
          "highlightText": "Another highlighted text.",
          "note": "",
          "highlightColor": "Yellow",
          "page": 2,
          "context": ""
        }
      ]
    }
  ]
}


CSV
Title,Authors,Journal,Year,Link,Citation,Annotations
Paper Title,"Author 1, Author 2",Journal Name,2023,https://link.to.paper.pdf,"Author 1, Author 2. Paper Title. Journal Name, 2023.","indeed~~~This is a note for the highlighted text.~~~This is the context of the highlighted text indeed.~~~Purple~~~1|||Another highlighted text.~~~~~~~~~Yellow~~~2"


LaTeX
\documentclass{article}
\usepackage[utf8]{inputenc}
\usepackage{hyperref}

\title{ Google Scholar annotation exporter }
\date{ 2023-01-01T12:00:00Z }
\author{ Google Scholar annotation exporter }

\begin{document}

\maketitle
\tableofcontents
\section{ Paper Title }

\begin{center}
  \begin{tabular}{||l l||}
    \hline
    \textbf{Field}   & \textbf{Value}                          \\ [0.5ex]
    \hline\hline
    \textbf{Authors} & Author 1, Author 2                      \\
    \hline
    \textbf{Journal} & Journal Name                            \\
    \hline
    \textbf{Year}    & 2023                                    \\
    \hline
    \textbf{Link}    & \href{ https://link.to.paper.pdf }{PDF} \\
    \hline
  \end{tabular}
\end{center}
\subsection{Citation}

Author 1, Author 2, 2023. Paper Title. Journal Name

\subsection{Annotations}

\subsubsection{ indeed. }
\begin{itemize}
  \item \textbf{Note}: This is a note for the highlighted text.
  \item \textbf{Color}: Purple
  \item \textbf{Page}: 1
\end{itemize}
\subsubsection{ Another highlighted text. }
\begin{itemize}
  \item \textbf{Color}: Yellow
  \item \textbf{Page}: 2
\end{itemize}

\end{document}


MARKDOWN
---
extension: Google Scholar annotation exporter
extension_homepage: https://chromewebstore.google.com/detail/google-scholar-annotation/dkcipnihgbegpammhgkobheodoknplma
extension_version: 1.0
export_date: 2023-01-01T12:00:00Z
number_of_papers: 1
number_of_annotations: 2
---

# Google Scholar Annotations Export

## Paper Title

| Metadata    | Value                            |
| ----------- | -------------------------------- |
| **Authors** | Author 1, Author 2               |
| **Journal** | Journal Name                     |
| **Year**    | 2023                             |
| **Link**    | [PDF](https://link.to.paper.pdf) |

### Annotations

1. | Field         | Value                                               |
   | ------------- | --------------------------------------------------- |
   | **Highlight** | indeed.                                             |
   | **Note**      | This is a note for the highlighted text.            |
   | **Context**   | This is the context of the highlighted text indeed. |
   | **Color**     | Purple                                              |
   | **Page**      | 1                                                   |
2. | Field         | Value                     |
   | ------------- | ------------------------- |
   | **Highlight** | Another highlighted text. |
   | **Note**      |                           |
   | **Context**   |                           |
   | **Color**     | Yellow                    |
   | **Page**      | 2                         |

---


Custom templates

Under the hood, Google Scholar annotation exporter uses Handlebars templates to generate the output in the selected format.
You can customize the output by providing your own Handlebars template in the "Advanced options" modal.
The default templates are located in the `src/templates` folder, and you can use them as a starting point for your own custom templates.
For more information on how to use Handlebars templates, please refer to the Handlebars documentation.

The context exposed to the templates includes the following properties:

type Context = {
  extension: string;
  extensionHomepage: string;
  extensionVersion: string;
  exportDate: string;
  numberOfPapers: number;
  numberOfAnnotations: number;
  papers: Paper[];
};

type Paper = {
  error: string;
  captcha: boolean;
  title: string;
  authors: string;
  year: string;
  link: string;
  citation: string;
  metadata: string[];
  annotations: Annotation[];
  journal: string;
};

export type Annotation = {
  highlightText: string;
  note: string;
  highlightColor: string;
  context: string;
  page: number;
};

Alternatives

Google Scholar Highlights Export
