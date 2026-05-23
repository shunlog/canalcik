## Requirements

**Platform**: hosted website for a single user.
Needs to be accessible both from mobile phone (to introduce data on the go)
and from the desktop, to view the Word docs, move them to usb and print them.
The website will need basic HTTP auth, because it will be exposed.

Features:
- View docs and excel sheets
- Upload document templates (using the templating language)
    - Can updated template by uploading new one
- Create documents by filling forms
    - autocomplete fields
    - search fields
    - date, integer, validation, etc.
- Generate and export document:
    - Save generated document version,
    so that when the template is updated, the older generated versions are still available
- Every edit is auto-saved
    - Incomplete forms are in a "draft" state

For each document kind,
the fields in the `.docx` template match the fields in the form.

## Documents

Generated documents:
- *Comanda materiale*
    - List of items:
        - *Denumirea materialului* `{name}`: str, *Denumire produs* from *Categorii produse*
        - *Specificația materialului*: str, *Nr. inmatriculare* from *Gestiune flota*
        - *UM*: str, unit of measurement (e.g. "buc", "set", "l")
        - *Cantitatea*: number (possibly float)
        - *Nomenclator D365*: str, *Cod produs* from *Categorii produse*


- *Act constatare defectiune*

Data sources:
- *Categorii produse* - spreadsheet of products
    - column 1: Categorie (microsoft word hierarchy, 5 levels)
    - column 2: 
        - *Denumire produs*: str
        - *Cod produs*: str (based on category)
- *Gestiune flota* - spreadsheet
    - *Nr. inmatriculare*
    - *Nr. inventar*
    - *Denumire configuratie*
    - *Sofer* (list, separated by "/")

