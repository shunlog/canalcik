# Canalcik

A web app made to facilitate the creation and management of documents 
for the Apa Canal Moldova company.

For a start, the website will provide forms for the creation of docx documents for 2 templates.
It will have lots of suggestions and defaults, to minimize input from the user.

We define a a physical data model for the documents and spreadsheets,
and reverse-engineer the conceptual data model that the organization implicitly uses.

The website will be used for:
1. Filling forms (with suggestions, reference validation) and generate documents from them
2. List and edit completed forms

## MVP

A home page with two big button links - pick which form you want to fill.

A form page has a "Generate" button at the end, which generates the file and saves to user's Google Drive.

Website is stateless, no view into the data storage - fill the form, generate, forget. Everything is lost on a page refresh.

DB exists, but only for autocomplete and validation.

The source data are taken from a csv stored locally for now.


## Development plan

### Step 1: Document templates and data types for them

The first thing we need to have is a set of templates, 
and a module for generating documents given data and templates.

The module will have the following:
- a data type for each template,
- a function for each template that take the respective data type and fills it in (e.g. `renderActDefectiune(data: DataActDefectiune) -> binary`),
- unit tests for these functions

The unit tests should guarantee that the data types map correctly to the templates,
so that we can use the data types as the module's contract.

I'm editing the templates in Google Docs, so to not download them manually, use `pnpm run fetch`.

I want to save the filled docs locally though, for now, just so I can visually inspect them.

## Requirements

The website that will be used by a single user.
Needs to be accessible both from mobile phone and desktop.

The website will need basic HTTP auth, so only the user can access it.


Form completion:
- fields with suggestions
    - e.g. look-up value from data source based on key from another field
    - e.g. suggestions based on cross-reference between fields
- sane defaults (e.g. today's date)
- field type validation
- quickly create one form from another
    - e.g. create an *act defectiune* for a material from the current *comanda materiale* field
- Every edit is auto-saved ("draft" state)


Document management:
- View completed forms
    - "completed" and "draft" states
    - group by date (maybe a calendar view)
- Generate document from form
    - each generation creates a new doc (in case if the user edited the older docs manually)
    - (to-do?) if the template changed, the user will be informed he can re-generate


Templates:
- Stored on Google Drive as `.odt`
- use `{{this_syntax}}` from docx-template for parameters
- parameters must match the form fields


### Data storage

All the data will be stored on the user's Google Drive.
The app will have its own folder, `canalcik`.

Data to be stored:
- Spreadsheets with source data: stored anywhere on the Drive, access through the "Publish CSV" feature, provide URL to the app through config
- Form completion data: stored in app' `canalcik/data`
- Generated documents:  stored in app's folder on Google Drive `canalcik/docs`
    - all documents generated from a form will be grouped in folders (e.g. `./act_defectiune_<date_created>/act_defectiune-<date_doc>-<n>.odt`)

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

The user creates the *comanda materiale* about 1/day,
and each such document is tied to 2-3 *act defectiune* documents.

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
    - "Informatie activ" section:
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

At the end of the month, for each vehicle:
- Fisa limita:
    - Numele soferului (e.g. Celpan Ion)
    - Nr. soferului (e.g. 4984) *driver code*
    - Nr inregistrare (e.g. CBE 276) *registration nr*
    - Data (luna, anul)
    - Nr inventar (e.g. 45251200) *inventory nr*
    - Lista materiale:
        - Data (e.g. 26.05.2026)
        - Nr. cartelei (e.g. 2111121795) *material code 2* (from the bill, not the internal one)


### Data sources

- "Categorii produse" (*categorii_produse*) - spreadsheet table:
    - column 1: Category (using MSWord hierarchy, 5 levels)
    - column 2: 
        - "Denumire produs": *material name*
        - "Cod produs": *material code*

- "Gestiune flota", tab "Vehicule" (*tabel_vehicule*) - spreadsheet table:
    - "Destinatia": *vehicle type*
    - "Marca/model": *vehicle model*
    - "Nr. inmatriculare": *registration nr*
    - "Nr. inventar": *inventory nr*
    - "Sofer": list of names, separated by "/"

- Gestiune flota, tab "Soferi":
    - Nume, prenume
    - Nr. de pontaj (e.g. 6832) *driver code*

# Existing solutions explored

- [Docassemble](https://docassemble.org/)
    - only asks one question at a time, but I want a form
    - doesn't have document management
- [Docupilot](https://www.docupilot.com/)
    - has a template editor that uses syntax `{{like_this}}`
    - don't see its document management capabilities
- Interactive PDF Form (AcroForm)
    - works in Firefox
    - doesn't seem to have features for external data sources or validation
