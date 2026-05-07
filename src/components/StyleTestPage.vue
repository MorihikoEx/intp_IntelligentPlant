<template>
  <section>
    <div class="box box-split-x">
      <button class="pl-2" @click="$emit('go-home')">
        <i class="bi bi-chevron-left"></i>
        返回
      </button>
    </div>

    <div class="box box-split-y">
      <div class="box-part glass-clear pb-5">
        <h1 class="mt-5 mb-0">H1 前端样式测试页</h1>
        <p class="mb-0">用于查看标题、按钮、标签、卡片、表单和布局效果。</p>
        <h2 class="mb-0">H2 这里是二级标题</h2>
        <h3 class="mb-0">H3 这里是三级标题</h3>
        <h4 class="mb-0">H4 这里是四级标题</h4>
        <h5>H5 这里是五级标题</h5>
      </div>
      <div class="box-part glass-frost">
        <div class="flex-x flex-x-center">
          <button class="shadow m-2">按钮</button>
          <button class="m-2" disabled>禁用按钮</button>
        </div>
      </div>
    </div>

    <div class="box glass-clear">
      <h2>标签样式</h2>
      <div class="flex-y mb-5">
        <div class="flex-x mb-5">
          <span class="tag-1 m-2">tag-1</span>
          <span class="tag-2 m-2">tag-2</span>
          <span class="tag-correct m-2">correct</span>
          <span class="tag-error m-2">error</span>
          <span class="tag-disabled m-2">disabled</span>
        </div>
        <div class="flex-x mb-3">
          <span class="bg-1 m-2">background-1</span>
          <span class="bg-2 m-2">background-2</span>
          <span class="bg-disabled m-2">Disabled</span>
        </div>
      </div>
    </div>

    <div class="flex-x">
      <div class="box glass-frost grow-1">
        <p class="left">
          这是一段左对齐文本。
        </p>
        <p class="left">
          <a href="https://www.gushiwen.cn/shiwenv_284e20a25958.aspx" target="_blank" title="临江仙·滚滚长江东逝水">滚滚长江东逝水</a>，浪花淘尽英雄。是非成败转头空。青山依旧在，几度夕阳红。
          白发渔樵江渚上，惯看秋月春风。一壶浊酒喜相逢。古今多少事，都付笑谈中。
        </p>
      </div>
      <div class="box glass-frost grow-1">
        <p class="left-indent">
          这是一段首行缩进文本。
        </p>
        <p class="left-indent">
          <a href="https://www.gushiwen.cn/shiwenv_284e20a25958.aspx" target="_blank" title="临江仙·滚滚长江东逝水">滚滚长江东逝水</a>，浪花淘尽英雄。是非成败转头空。青山依旧在，几度夕阳红。
          白发渔樵江渚上，惯看秋月春风。一壶浊酒喜相逢。古今多少事，都付笑谈中。
        </p>
      </div>
    </div>

    <div class="flex-x">
      <div class="box glass-frost grow-1">
        <h2>表单控件</h2>
        <div class="style-form">
          <label>输入框</label>
          <input id="style-input" class="mb-3" placeholder="请输入测试内容" type="text"/>

          <label for="style-select">下拉菜单</label>
          <div class="select-wrap select-wrap-icon mb-5">
            <select id="style-select">
              <option>选项一</option>
              <option>选项二</option>
              <option>选项三</option>
            </select>
            <i aria-hidden="true" class="bi bi-list select-custom-icon"></i>
          </div>
        </div>
      </div>

      <div class="box glass-clear grow-2 flex-x">
        <div class="box grow-1 py-0">
          <img alt="morihiko" class="img-radius shadow" src="/public/img/morihiko.jpg">
        </div>

        <div class="box grow-2 mt-0 py-0 left">
          <h1 class="my-0"><i class="bi bi-wechat"></i>Morihiko</h1>
          <p class="my-0">wxid:morihiko</p>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
defineEmits(['go-home'])
</script>

<style scoped>

</style>
