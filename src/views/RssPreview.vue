              <h4 class="text-base font-semibold text-[#333333] group-hover:text-blue-600">
                <a :href="item.link" target="_blank" class="focus:outline-none">
                  <span class="absolute inset-0" aria-hidden="true" />
                  {{ item.title }}
                </a>
              </h4>
              <p class="mt-2 text-sm text-[#4D4D4D] line-clamp-4" v-html="item.description"></p> 