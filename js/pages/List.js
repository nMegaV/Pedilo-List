import { store } from "../main.js";
import { embed, getThumbnailFromId, getYoutubeIdFromUrl } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <Transition name="bg-fade">
                <div v-if="level" class="level-bg" :key="backgroundImage" :style="{ backgroundImage: \`url(\${backgroundImage})\` }"></div>
            </Transition>
            <div class="list-container">
                <div class="search">
                    <input type="text" v-model="search" placeholder="Search level..." class="type-label-lg" />
                </div>
                <table class="list" v-if="list">
                    <tr v-for="({ level, err, i }) in filteredList">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                                <span v-if="level" class="author type-label-md">by {{ level.author }}</span>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="filteredList.length === 0">
                        <td colspan="2" style="text-align: center;">
                            <p class="type-label-lg">No levels found</p>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <div class="video-card">
                        <div class="tabs" v-if="level.showcase">
                            <button class="tab" :class="{ selected: !toggledShowcase }" @click="toggledShowcase = false">
                                <span class="type-label-lg">Verification</span>
                            </button>
                            <button class="tab" :class="{ selected: toggledShowcase }" @click="toggledShowcase = true">
                                <span class="type-label-lg">Showcase</span>
                            </button>
                        </div>
                        <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    </div>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <button class="copy" @click="copy(level.id, 'id')">
                                <p>{{ level.id }}</p>
                                <span class="type-label-sm">{{ copied === 'id' ? 'Copied!' : 'Copy' }}</span>
                            </button>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <button v-if="level.password && level.password.toLowerCase() !== 'free to copy'" class="copy" @click="copy(level.password, 'password')">
                                <p>{{ level.password }}</p>
                                <span class="type-label-sm">{{ copied === 'password' ? 'Copied!' : 'Copy' }}</span>
                            </button>
                            <p v-else>Free to Copy</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected +1 <= 150"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Requisitos</h3>
                    <p>
                        Tenes que haberte pasado el nivel sin usar hacks
                    </p>
                    <p>
                        Manda un video pasandote el nivel al discord y ahi se ve si lo ponemos en la lista
                    </p>
                    <p>
                        No hace falta que tenga audio de clicks, con un indicador de clicks en el nivel es suficiente
                    </p>
                    <p>
                        Que se vean mas intentos que solo en el que te pasas el nivel
                    </p>
                    <p>
                        El video tiene que mostrar como llegas hasta el final del nivel
                    </p>
                    <p>
                        No te aproveches de bugs o secret ways
                    </p>
                    <p>
                        No uses algo como un modo facil para pasarte el nivel
                    </p>
                    <p>
                        Y bueno eso chavaleria, a disfrutar la PEDILO list
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        toggledShowcase: false,
        search: "",
        copied: null,
        errors: [],
        roleIconMap,
        store
    }),
    computed: {
        level() {
            return this.list[this.selected][0];
        },
        filteredList() {
            const q = this.search.trim().toLowerCase();
            return this.list
                .map(([level, err], i) => ({ level, err, i }))
                .filter(({ level }) => !q || level?.name.toLowerCase().includes(q));
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
        backgroundImage() {
            const source = !this.level.showcase
                ? this.level.verification
                : (this.toggledShowcase ? this.level.showcase : this.level.verification);
            const id = getYoutubeIdFromUrl(source);
            return id ? getThumbnailFromId(id).replace("mqdefault", "hqdefault") : "";
        },
    },
    watch: {
        selected() {
            this.toggledShowcase = false;
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
        async copy(text, field) {
            try {
                await navigator.clipboard.writeText(String(text));
                this.copied = field;
                setTimeout(() => {
                    if (this.copied === field) this.copied = null;
                }, 1500);
            } catch (e) {
                this.errors.push("Could not copy to clipboard.");
            }
        },
    },
};
