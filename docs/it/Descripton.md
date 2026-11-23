Esporta le annotazioni (evidenziazioni e note) del lettore PDF di Google Scholar in JSON, CSV, LaTeX, Markdown, o formato personalizzato.

Questa estensione è open source. Esplora il codice sorgente su https://github.com/TendTo/google-scholar-annotation-exporter.

Installazione

- Installa l’estensione Google Scholar PDF Reader.
- Installa l’estensione Google Scholar annotation exporter.
- Apri un PDF nel Google Scholar PDF Reader, fai clic sul pulsante "Export annotations" nella barra degli strumenti e scegli il formato di esportazione preferito (JSON, CSV o Markdown).

Formato di output

Le annotazioni esportate verranno salvate nel formato scelto con la seguente struttura:

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
      "link": "www.link.to.paper.pdf",
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
Paper Title,"Author 1, Author 2",Journal Name,2023,www.link.to.paper.pdf,"Author 1, Author 2. Paper Title. Journal Name, 2023.","indeed~~~This is a note for the highlighted text.~~~This is the context of the highlighted text indeed.~~~Purple~~~1|||Another highlighted text.~~~~~~~~~Yellow~~~2"


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
    \textbf{Link}    & \href{ www.link.to.paper.pdf }{PDF} \\
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
| **Link**    | [PDF](www.link.to.paper.pdf) |

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

Formato personalizzato

Google Scholar annotation exporter utilizza i template Handlebars per generare l'output nel formato selezionato.
Puoi personalizzare l'output fornendo il tuo template Handlebars nella finestra di dialogo "Opzioni avanzate".
I template predefiniti si trovano nella cartella `src/templates`, e puoi usarli come punto di partenza per i tuoi template personalizzati.
Per ulteriori informazioni su come utilizzare i template Handlebars, consulta la documentazione di Handlebars.

Al template engine viene fornito un contesto che include le seguenti proprietà:

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

Alternative

Google Scholar Highlights Export
