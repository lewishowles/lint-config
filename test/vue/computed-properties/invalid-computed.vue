<script setup>
import { computed, ref } from "vue";

const count = ref(0);

const sideEffect = computed(() => {
	// oxlint-disable-next-line vue/no-side-effects-in-computed-properties
	count.value += 1;

	return count.value;
});

// oxlint-disable-next-line vue/no-async-in-computed-properties
const asyncValue = computed(async () => await Promise.resolve(count.value));
</script>

<template>{{ sideEffect }} {{ asyncValue }}</template>
