# Data model — conceptual ER diagram

Entity names are in Romanian (matching the documents); relationships are in English.

Entities are colored by kind:

- **Blue** — digital: the `.odt` documents, the source spreadsheets, and the rows inside them that reference real-world things.
- **Amber** — physical: real-world things and master-data lookups (vehicles, materials, drivers).
- **Green** — concepts: abstract notions with no physical referent (units of measure, defect descriptions, work descriptions).

```mermaid
erDiagram
    ComandaMateriale ||--o{ RandComanda : contains
    RandComanda }o--|| Material : "is for"
    RandComanda }o--|| UnitateMasura : "in"
    RandComanda }o--o| Vehicul : "registration nr"

    ActDefectiune }o--|| Vehicul : "is about"
    ActDefectiune ||--o{ Defectiune : contains
    ActDefectiune ||--o{ PiesaSchimb : contains
    ActDefectiune ||--o{ LucrareReparatie : contains
    PiesaSchimb }o--|| Material : "is"
    PiesaSchimb }o--|| UnitateMasura : "in"
    PiesaSchimb }o--|| Defectiune : "caused by"
    LucrareReparatie }o--|| UnitateMasura : "in"
    LucrareReparatie }o--|| Defectiune : "caused by"

    CategoriiProduse ||--o{ Material : "lists"
    GestiuneFlota ||--o{ Vehicul : "lists"
    GestiuneFlota }o--o{ Sofer : "assigns"

    ComandaMateriale {
        date date
    }
    ActDefectiune {
        date date
    }
    CategoriiProduse {
        string category_path
    }
    GestiuneFlota {
        string configuration_name
    }
    RandComanda {
        number quantity
    }
    PiesaSchimb {
        number quantity
        bool needs_replacement
    }
    Defectiune {
        string description
        string probable_cause
    }
    LucrareReparatie {
        string description
        number quantity
    }
    Vehicul {
        string type
        string model
        string registration_nr
        int inventory_nr
        int year
    }
    Material {
        string name
        string code
    }
    Sofer {
        string name
    }
    UnitateMasura {
        string code
    }

    classDef digital fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef physical fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef concept  fill:#dcfce7,stroke:#16a34a,color:#14532d

    class ComandaMateriale,ActDefectiune,CategoriiProduse,GestiuneFlota digital
    class RandComanda,PiesaSchimb digital
    class Vehicul,Material,Sofer physical
    class UnitateMasura,Defectiune,LucrareReparatie concept
```
