# svelte-register-ex

svelte/register + typescript + scss

## how to use

create your svelte file with ts and scss.
```html
<script lang="ts">
  export let foo: string;
  export let bar: number;
</script>

<div class="w1">
  <div class="w2">{foo}{bar}<div>
</div>

<style lang="scss">
  .w1{
    .w2{
      background:red;
    }
  }
</style>
```

and require
```javascript
require("svelte-register-ex")

const template = reuqire("./your_svelte_file.svelte").default
const { html ,css, head } = template.render({
  foo: "bar",
  hoge: "huga",
})
```