<script setup lang="ts">
const label: string | undefined = "ready";
// oxlint-disable-next-line typescript/no-non-null-assertion
const labelLength = label!.length;
</script>

<template>{{ labelLength }}</template>
