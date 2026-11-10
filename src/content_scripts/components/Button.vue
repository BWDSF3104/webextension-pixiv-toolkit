<template>
  <a class="button"
    :class="classnames"
    :href="href"
    :download="download"
    :title="title"
    @click="handleClick"><slot>{{ text }}</slot></a>
</template>

<script>
export default {
  props: {
    text: [String, Number],
    href: String,
    download: String,
    title: String,
    type: {
      required: false,
      type: String
    },
    disabled: {
      required: false,
      type: Boolean,
      default: false
    }
  },

  computed: {
    classnames() {
      let classnames = [];

      if (this.type) {
        classnames.push(`button--${this.type}`);
      }

      if (this.disabled) {
        classnames.push(`button--disabled`);
      }

      return classnames.join(' ');
    }
  },

  methods: {
    handleClick() {
      if (!this.disabled) {
        this.$emit('click');
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .button {
    display:inline-block;
    margin: 0 2.5px;
    padding: 6px 22px;
    border-radius: 50px;
    font-size: 12px;
    background: rgb(0, 150, 250);
    border:rgb(0, 150, 250) solid 3px;
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s;
  }

  .button--success {
    border-color:#00dc68;
  }

  .button--select {
    background: #0b74c4;
    border-color: #0b74c4;
  }

  .button--download {
    background: #0a7d46;
    border-color: #0a7d46;
  }

  .button--close {
    background: #5b6b78;
    border-color: #5b6b78;
  }

  .button--disabled {
    opacity: 0.3;
  }
</style>
