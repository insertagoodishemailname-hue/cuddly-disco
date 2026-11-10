const { createApp } = Vue;

createApp({
  data() {
    return {
      currentTab: "shows",
      searchBox: "",
      filterBox: "all",
      loading: false,
      errorState: false,
      currentList: [],
      modalOpen: false,
      selectedItem: null,
      movieDirectors: [], // directors found in the movie results

      // [value, text shown]
      filterOptions: {
        shows: [
          ["all", "All Genres"],
          ["Drama", "Drama"],
          ["Comedy", "Comedy"],
          ["Action", "Action"],
          ["Science-Fiction", "Sci-Fi"],
          ["Thriller", "Thriller"],
          ["Horror", "Horror"]
        ],
        movies: [
          ["all", "All Directors"]
        ],
        trivia: [
          ["11", "Film"],
          ["14", "Television"],
          ["13", "Musicals & Theatres"],
          ["32", "Cartoon & Animations"],
          ["31", "Anime & Manga"]
        ]
      },

      titles: {
        shows: ["TV Show Explorer", "Powered by TVMaze API"],
        movies: ["Movie Explorer", "Powered by Studio Ghibli API"],
        trivia: ["Entertainment Trivia", "Powered by Open Trivia Database"]
      }
    };
  },

  computed: {
    // dropdown for the shows and movies tabs
    dropdownOptions() {
      if (this.currentTab === "movies") {
        // "All Directors" + the directors found in the results
        var list = [["all", "All Directors"]];
        for (var i = 0; i < this.movieDirectors.length; i++) {
          list.push([this.movieDirectors[i], this.movieDirectors[i]]);
        }
        return list;
      }
      return this.filterOptions[this.currentTab];
    }
  },

  methods: {
    // Change tab
    changeTab(tab) {
      this.currentTab = tab;
      this.searchBox = "";
      this.filterBox = this.filterOptions[tab][0][0]; // first option of that tab
      this.loadData();
    },

    // Load data from the API of the current tab
    async loadData() {
      this.loading = true;
      this.errorState = false;
      this.currentList = [];

      try {
        if (this.currentTab === "shows") {
          // API 1: TVMaze
          var query = this.searchBox.trim() !== "" ? this.searchBox : "batman";
          var url = "https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(query);
          var response = await fetch(url);
          if (!response.ok) throw new Error("TVMaze error");
          var data = await response.json();

          // each item is { score, show }, so we take only the show
          var shows = data.map(item => item.show);

          // filter by genre
          if (this.filterBox !== "all") {
            shows = shows.filter(show => show.genres.includes(this.filterBox));
          }
          this.currentList = shows;

        } else if (this.currentTab === "movies") {
          // API 2: Studio Ghibli API (gives all 22 films, we search/filter in JavaScript)
          var url = "https://ghibliapi.vercel.app/films";
          var response = await fetch(url);
          if (!response.ok) throw new Error("Ghibli error");
          var movies = await response.json();
          console.log("Ghibli films found:", movies.length);

          // build the director list from the movies we got
          this.movieDirectors = [];
          for (var i = 0; i < movies.length; i++) {
            var director = movies[i].director;
            if (director && !this.movieDirectors.includes(director)) {
              this.movieDirectors.push(director);
            }
          }

          // search by title
          var text = this.searchBox.trim().toLowerCase();
          if (text !== "") {
            movies = movies.filter(movie =>
              movie.title.toLowerCase().includes(text) ||
              movie.original_title_romanised.toLowerCase().includes(text)
            );
          }

          // filter by director
          if (this.filterBox !== "all") {
            movies = movies.filter(movie => movie.director === this.filterBox);
          }
          this.currentList = movies;

        } else if (this.currentTab === "trivia") {
          // API 3: Open Trivia Database
          var url = "https://opentdb.com/api.php?amount=10&type=multiple&category=" + this.filterBox;
          var response = await fetch(url);
          if (!response.ok) throw new Error("Trivia error");
          var data = await response.json();

          // response_code 0 = success (5 = too many requests, wait 5 seconds)
          if (data.response_code !== 0) throw new Error("Trivia code " + data.response_code);

          // add show: false so the answer is hidden at first
          this.currentList = data.results.map(item => {
            item.show = false;
            return item;
          });
        }

      } catch (error) {
        console.error(error);
        this.errorState = true;
      } finally {
        this.loading = false;
      }
    },

    // Open the details popup
    showDetails(item) {
      this.selectedItem = item;
      this.modalOpen = true;
    },

    // Close the details popup
    closeModal() {
      this.modalOpen = false;
      this.selectedItem = null;
    }
  },

  // Runs when the page first opens
  mounted() {
    this.loadData();
  }
}).mount("#app");