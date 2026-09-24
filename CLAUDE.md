- Tech stack: pnpm, TypeScript, jest
- Write comments in code very sparingly, only when it would actually be useful to an advanced developer
- Prefer consistency throughout the codebase to quick hacks that "just work"
- Prefer simple solutions, ask before attempting a complex solution

# Stopping the dev server

After running `pnpm dev` / `pnpm dev:server`
stop the server by killing by port:
```sh
lsof -ti:8787 | xargs kill
```

# Frontend

## Extract entity labels and links

Don't link to an entity's page directly like this:
```ts
<Anchor component={Link} to={`/driveri/${driver.id}`}>
  {${s.name} (${s.code})}
</Anchor>
```

This snippet is likely to be duplicated across many pages, 
and might introduce inconsistencies in labels.
For example, some page might accidentally link as just `${s.name}` instead of `${s.name} (${s.code})`.

Instead, use two helpers: a label function and a link component, like these:
```ts
export const driverLabel = (s: DriverRef) => `${s.name} (${s.code})`;

export function DriverLink({ driver, ...rest }: { driver: DriverRef } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/driveri/${driver.id}`} {...rest}>
      {driverLabel(driver)}
    </Anchor>
  );
}
```

The reason for the label function is that sometimes entities need to be referenced
in UI elements other than Anchor (e.g. a Multiselect input component).

## UI: set maximum widths

Only `mantine-datatable`'s `DataTable` (used on `*ListPage`s) should stay full width. Everything else — form fields, plain Mantine `Table`s, standalone inputs like `MultiSelect`, and the `Fieldset` wrapping any of them — should get a `maw` sized to its content, the way `SoferFields.tsx` does, instead of stretching to fill the page. A `Fieldset`/`Stack` needs its own `maw` even when its contents already have one, since a block container doesn't shrink to fit its children.
