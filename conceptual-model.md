# Data model — conceptual diagram

Entities in the real-world domain only. No documents, spreadsheets, table-rows, or other representation concerns — those live in [logical-model.md](logical-model.md).

Entity names are in Romanian; relationships are in English.

- **Orange** — physical entities: real-world things you can point at.
- **Green** — conceptual entities: things that exist as records of events or specifications, not as physical objects.

```mermaid
flowchart LR
    subgraph PhysicalGroup ["Physical"]
        Vehicul["<b>Vehicul</b><br/>type, model, year, plate"]
        Sofer["<b>Sofer</b><br/>name"]
        Material["<b>Material</b><br/>name, code"]
    end

    subgraph ConceptualGroup ["Conceptual"]
        direction TB
        Defectiune["<b>Defectiune</b><br/>description, cause"]
        ComandaMaterial["<b>ComandaMaterial</b><br/>quantity, date"]
        LucrareReparatie["<b>LucrareReparatie</b><br/>description, quantity"]
        ModelVehicul
    end

    Sofer ---|"drives (N:N)"| Vehicul
    Defectiune -->|"on (N:1)"| Vehicul
    Defectiune -->|"fixed by (1:N)"| LucrareReparatie
    ComandaMaterial -->|"to fix"| Defectiune
    ComandaMaterial -->|"orders"| Material
    ComandaMaterial -->|"of kind"| ModelVehicul
    Vehicul --> ModelVehicul

    classDef physical fill:#ffedd5,stroke:#ea580c,color:#7c2d12
    classDef concept  fill:#dcfce7,stroke:#16a34a,color:#14532d

    class Vehicul,Sofer,Material physical
    class Defectiune,ComandaMaterial,LucrareReparatie,ModelVehicul concept

    style PhysicalGroup   fill:#ffedd533,stroke:#ea580c,color:#7c2d12
    style ConceptualGroup fill:#dcfce733,stroke:#16a34a,color:#14532d
```
