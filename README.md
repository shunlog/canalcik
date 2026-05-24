## Requirements

""Platform"": hosted website for a single user.
Needs to be accessible both from mobile phone (to introduce data on the go)
and from the desktop, to view the Word docs, move them to usb and print them.
The website will need basic HTTP auth, because it will be exposed.

Features:
- View docs and excel sheets (or just open in Google docs?)
- Upload document templates (using the templating language)
    - Can updated template by uploading new one
- Create documents by filling forms
    - autocomplete fields
    - search fields
    - date, integer, validation, etc.
- Generate and export document
    - Save generated document version,
    so that when the template is updated, the older generated versions are still available
- Every edit is auto-saved
    - Incomplete forms are in a "draft" state

For each document kind,
the fields in the `.docx` template match the fields in the form.


## To Do

- Implement referential integrity. In doc *act defectiune*, there are two table fields that reference rows in another table by their index. Make it so once the user referenced a row, the reference is kept correctly (stay correct when rows get re-ordered, block deleting, warning on stale references)

## Data model

The italics (\*\*) signifies a reference key (for documents/tables)
or a name of a custom data type.

The names inside quotes are the words as they appear in the documents.

### Shared data types

These act as foreign keys, or are just conventional data types (e.g. unit of measurement).

- *material name*: str (e.g. "Bara reactiva K-3 MAZ 5337")
- *material code*: str (e.g. "120673")
- *registration nr*: str (e.g. "CA 786")
- *inventory nr*: int (e.g. "42691696")
- *measurement unit*: str (e.g. "buc", "set", "l")
- *vehicle type*: str (e.g. "Tractor", "Excavator")
- *vehicle model*: str (e.g. "MTZ-82")

### Generated documents


- "Comanda de materiale" (*comanda materiale*)
    - Date
    - Table:
        - "Denumirea materialului": *material name*
        - "Specificația materialului": *registration nr*
        - "UM": *measurement unit*
        - "Cantitatea": number
        - "Nomenclator D365": *material code*


- "Act de constatare a defectiunilor" (*act defectiune*):
    - Date
    - "Informatie activ":
        - "Nr. inventar": *inventory nr*
        - "nr. de înregistrare": *registration nr*
        - "Denumire conform datelor contabile": *vehicle type* + *vehicle model*
        - "Anul producerii": year
    - "Lista defecțiunilor" (*tab 1*) table:
        - "Defecțiunea": str
        - "Cauzele probabile ale defecțiunilor": str
    - "Lista pieselor de schimb" (*tab 2*) table:
        - "Nr. nomenclator": *material code*
        - "Piesa de schimb/ ansamblul component": *material name*
        - "UM": *measurement unit*
        - "Cantitate": number
        - "Cauza (rând din tab. 1)": row index from *tab 1*
        - "Necesită înlocuire": "da" or "nu"
    - "Lista lucrărilor de reparații necesare" table:
        - "Denumirea lucrărilor": str (e.g. "de inlocuit <*material name*>")
        - "UM": *measurement unit*, (default: same as in *tab 2*)
        - "Cantitate": number (default: same as in *tab 2*)
        - "Cauza (rând din tab. 1)": row index from *tab 1*



### Data sources

- "Categorii produse" - spreadsheet of products:
    - column 1: Category (using MSWord hierarchy, 5 levels)
    - column 2: 
        - "Denumire produs": *material name*
        - "Cod produs": *material code*

- "Gestiune flota" - spreadsheet
    - "Destinatia": *vehicle type*
    - "Marca/model": *vehicle model*
    - "Nr. inmatriculare": *registration nr*
    - "Nr. inventar": *inventory nr*
    - "Denumire configuratie"
    - "Sofer": list of names, separated by "/"
