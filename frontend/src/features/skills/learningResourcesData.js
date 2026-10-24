/**
 * Curated catalogue of verified external practice and learning resources.
 * Links directly to:
 * 1. Striver's A2Z Sheet + verified LeetCode problem URLs
 * 2. IndiaBIX Aptitude official topics
 * 3. GeeksforGeeks and W3Schools language tutorials
 */

export const STRIVER_SHEET_URL = 'https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet'
export const LEETCODE_BASE_URL = 'https://leetcode.com/problemset/'
export const INDIABIX_BASE_URL = 'https://www.indiabix.com/aptitude/'
export const GFG_BASE_URL = 'https://www.geeksforgeeks.org/tutorials/programming-language-tutorials/'
export const W3SCHOOLS_BASE_URL = 'https://www.w3schools.com/tutorials/index.php'

export const DSA_PROBLEMS = [
  // Arrays
  {
    id: 'dsa_arr_two_sum',
    title: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    striverUrl: 'https://takeuforward.org/data-structure/two-sum-check-if-a-pair-with-given-sum-exists-in-array/',
    leetcodeUrl: 'https://leetcode.com/problems/two-sum/',
  },
  {
    id: 'dsa_arr_stock_buy_sell',
    title: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    difficulty: 'Easy',
    striverUrl: 'https://takeuforward.org/data-structure/stock-buy-and-sell/',
    leetcodeUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
  },
  {
    id: 'dsa_arr_kadane',
    title: "Maximum Subarray (Kadane's Algorithm)",
    topic: 'Arrays',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/kadanes-algorithm-maximum-subarray-sum-in-an-array/',
    leetcodeUrl: 'https://leetcode.com/problems/maximum-subarray/',
  },
  {
    id: 'dsa_arr_next_permutation',
    title: 'Next Permutation',
    topic: 'Arrays',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/next_permutation-find-next-lexicographically-greater-permutation/',
    leetcodeUrl: 'https://leetcode.com/problems/next-permutation/',
  },

  // Binary Search
  {
    id: 'dsa_bs_binary_search',
    title: 'Binary Search',
    topic: 'Binary Search',
    difficulty: 'Easy',
    striverUrl: 'https://takeuforward.org/data-structure/binary-search-explained/',
    leetcodeUrl: 'https://leetcode.com/problems/binary-search/',
  },
  {
    id: 'dsa_bs_rotated_sorted_array',
    title: 'Search in Rotated Sorted Array',
    topic: 'Binary Search',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/search-in-rotated-sorted-array-i/',
    leetcodeUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
  },
  {
    id: 'dsa_bs_find_peak_element',
    title: 'Find Peak Element',
    topic: 'Binary Search',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/find-peak-element/',
    leetcodeUrl: 'https://leetcode.com/problems/find-peak-element/',
  },

  // Strings
  {
    id: 'dsa_str_valid_anagram',
    title: 'Valid Anagram',
    topic: 'Strings',
    difficulty: 'Easy',
    striverUrl: 'https://takeuforward.org/data-structure/check-if-two-strings-are-anagrams-of-each-other/',
    leetcodeUrl: 'https://leetcode.com/problems/valid-anagram/',
  },
  {
    id: 'dsa_str_longest_substring',
    title: 'Longest Substring Without Repeating Characters',
    topic: 'Strings',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/length-of-longest-substring-without-any-repeating-characters/',
    leetcodeUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
  },

  // Linked Lists
  {
    id: 'dsa_ll_reverse_linked_list',
    title: 'Reverse Linked List',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    striverUrl: 'https://takeuforward.org/data-structure/reverse-a-linked-list-iterative-and-recursive/',
    leetcodeUrl: 'https://leetcode.com/problems/reverse-linked-list/',
  },
  {
    id: 'dsa_ll_linked_list_cycle',
    title: 'Detect Cycle in Linked List',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    striverUrl: 'https://takeuforward.org/data-structure/detect-a-cycle-in-a-linked-list/',
    leetcodeUrl: 'https://leetcode.com/problems/linked-list-cycle/',
  },
  {
    id: 'dsa_ll_merge_sorted_lists',
    title: 'Merge Two Sorted Lists',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    striverUrl: 'https://takeuforward.org/data-structure/merge-two-sorted-linked-lists/',
    leetcodeUrl: 'https://leetcode.com/problems/merge-two-sorted-lists/',
  },

  // Stacks and Queues
  {
    id: 'dsa_sq_valid_parentheses',
    title: 'Valid Parentheses',
    topic: 'Stacks and Queues',
    difficulty: 'Easy',
    striverUrl: 'https://takeuforward.org/data-structure/check-for-balanced-parentheses/',
    leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/',
  },
  {
    id: 'dsa_sq_next_greater_element',
    title: 'Next Greater Element I',
    topic: 'Stacks and Queues',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/next-greater-element-using-stack/',
    leetcodeUrl: 'https://leetcode.com/problems/next-greater-element-i/',
  },

  // Trees & BST
  {
    id: 'dsa_tree_max_depth',
    title: 'Maximum Depth of Binary Tree',
    topic: 'Trees',
    difficulty: 'Easy',
    striverUrl: 'https://takeuforward.org/data-structure/maximum-depth-of-a-binary-tree/',
    leetcodeUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
  },
  {
    id: 'dsa_tree_validate_bst',
    title: 'Validate Binary Search Tree',
    topic: 'Binary Search Trees',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/check-if-a-tree-is-a-binary-search-tree-or-bst/',
    leetcodeUrl: 'https://leetcode.com/problems/validate-binary-search-tree/',
  },
  {
    id: 'dsa_tree_lca_bst',
    title: 'Lowest Common Ancestor of a BST',
    topic: 'Binary Search Trees',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/lowest-common-ancestor-for-two-given-nodes/',
    leetcodeUrl: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/',
  },

  // Dynamic Programming
  {
    id: 'dsa_dp_climbing_stairs',
    title: 'Climbing Stairs',
    topic: 'Dynamic Programming',
    difficulty: 'Easy',
    striverUrl: 'https://takeuforward.org/data-structure/dynamic-programming-climbing-stairs/',
    leetcodeUrl: 'https://leetcode.com/problems/climbing-stairs/',
  },
  {
    id: 'dsa_dp_coin_change',
    title: 'Coin Change',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/coin-change-2-dp-22/',
    leetcodeUrl: 'https://leetcode.com/problems/coin-change/',
  },
  {
    id: 'dsa_dp_longest_increasing_subsequence',
    title: 'Longest Increasing Subsequence',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/longest-increasing-subsequence-dp-41/',
    leetcodeUrl: 'https://leetcode.com/problems/longest-increasing-subsequence/',
  },

  // Graphs
  {
    id: 'dsa_graph_number_of_islands',
    title: 'Number of Islands',
    topic: 'Graphs',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/number-of-islands/',
    leetcodeUrl: 'https://leetcode.com/problems/number-of-islands/',
  },
  {
    id: 'dsa_graph_rotting_oranges',
    title: 'Rotting Oranges',
    topic: 'Graphs',
    difficulty: 'Medium',
    striverUrl: 'https://takeuforward.org/data-structure/rotting-oranges-min-time-to-rot-all-oranges-bfs/',
    leetcodeUrl: 'https://leetcode.com/problems/rotting-oranges/',
  },
]

export const APTITUDE_TOPICS = [
  {
    id: 'apt_percentages',
    title: 'Percentages',
    category: 'Quantitative Aptitude',
    url: 'https://www.indiabix.com/aptitude/percentage/',
    description: 'Calculate percentages, fractions, base increments, and rate changes.',
  },
  {
    id: 'apt_profit_loss',
    title: 'Profit and Loss',
    category: 'Quantitative Aptitude',
    url: 'https://www.indiabix.com/aptitude/profit-and-loss/',
    description: 'Cost price, selling price, marked price, discounts, and margins.',
  },
  {
    id: 'apt_time_work',
    title: 'Time and Work',
    category: 'Quantitative Aptitude',
    url: 'https://www.indiabix.com/aptitude/time-and-work/',
    description: 'Work efficiency, man-hours, alternate days, and pipes & cisterns.',
  },
  {
    id: 'apt_time_distance',
    title: 'Time, Speed, and Distance',
    category: 'Quantitative Aptitude',
    url: 'https://www.indiabix.com/aptitude/time-and-distance/',
    description: 'Relative speed, trains, upstream/downstream boats, and circular tracks.',
  },
  {
    id: 'apt_ratios',
    title: 'Ratios and Proportions',
    category: 'Quantitative Aptitude',
    url: 'https://www.indiabix.com/aptitude/ratio-and-proportion/',
    description: 'Dividing quantities, mean proportions, and mixture problems.',
  },
  {
    id: 'apt_averages',
    title: 'Averages',
    category: 'Quantitative Aptitude',
    url: 'https://www.indiabix.com/aptitude/averages/',
    description: 'Arithmetic mean, weighted averages, and replacement of group members.',
  },
  {
    id: 'apt_probability',
    title: 'Probability',
    category: 'Quantitative Aptitude',
    url: 'https://www.indiabix.com/aptitude/probability/',
    description: 'Coins, dice, playing cards, mutually exclusive and independent events.',
  },
  {
    id: 'apt_permutations_combinations',
    title: 'Permutations and Combinations',
    category: 'Quantitative Aptitude',
    url: 'https://www.indiabix.com/aptitude/permutation-and-combination/',
    description: 'Factorials, arrangements, team selections, and circular permutations.',
  },
  {
    id: 'apt_data_interpretation',
    title: 'Data Interpretation',
    category: 'Data Interpretation',
    url: 'https://www.indiabix.com/data-interpretation/table-charts/',
    description: 'Tabular charts, bar graphs, pie charts, and data sufficiency.',
  },
  {
    id: 'apt_logical_reasoning',
    title: 'Logical Reasoning',
    category: 'Reasoning',
    url: 'https://www.indiabix.com/logical-reasoning/questions-and-answers/',
    description: 'Blood relations, seating arrangements, syllogisms, and sequence series.',
  },
  {
    id: 'apt_verbal_ability',
    title: 'Verbal Ability',
    category: 'Verbal Ability',
    url: 'https://www.indiabix.com/verbal-ability/questions-and-answers/',
    description: 'Sentence correction, reading comprehension, idioms, and vocabulary.',
  },
  {
    id: 'apt_non_verbal_reasoning',
    title: 'Non-Verbal Reasoning',
    category: 'Reasoning',
    url: 'https://www.indiabix.com/non-verbal-reasoning/questions-and-answers/',
    description: 'Pattern completion, mirror images, paper folding, and embedded figures.',
  },
]

export const PROGRAMMING_LANGUAGES = [
  {
    id: 'prog_python',
    language: 'Python',
    topics: [
      {
        id: 'prog_py_syntax',
        title: 'Python Syntax & Variables',
        gfgUrl: 'https://www.geeksforgeeks.org/python-programming-language-tutorial/',
        w3Url: 'https://www.w3schools.com/python/python_syntax.asp',
      },
      {
        id: 'prog_py_datastructures',
        title: 'Lists, Tuples, Dictionaries, and Sets',
        gfgUrl: 'https://www.geeksforgeeks.org/python-data-structures/',
        w3Url: 'https://www.w3schools.com/python/python_lists.asp',
      },
      {
        id: 'prog_py_oop',
        title: 'Object-Oriented Programming (Classes & Inheritance)',
        gfgUrl: 'https://www.geeksforgeeks.org/python-oops-concepts/',
        w3Url: 'https://www.w3schools.com/python/python_classes.asp',
      },
      {
        id: 'prog_py_modules',
        title: 'Modules, File Handling, and Exceptions',
        gfgUrl: 'https://www.geeksforgeeks.org/python-modules/',
        w3Url: 'https://www.w3schools.com/python/python_file_handling.asp',
      },
    ],
  },
  {
    id: 'prog_java',
    language: 'Java',
    topics: [
      {
        id: 'prog_java_basics',
        title: 'Java Basics, Datatypes, and Control Statements',
        gfgUrl: 'https://www.geeksforgeeks.org/java/',
        w3Url: 'https://www.w3schools.com/java/java_syntax.asp',
      },
      {
        id: 'prog_java_oop',
        title: 'OOP Concepts (Encapsulation, Polymorphism, Abstraction)',
        gfgUrl: 'https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/',
        w3Url: 'https://www.w3schools.com/java/java_classes.asp',
      },
      {
        id: 'prog_java_collections',
        title: 'Java Collections Framework (List, Map, Set)',
        gfgUrl: 'https://www.geeksforgeeks.org/collections-in-java-2/',
        w3Url: 'https://www.w3schools.com/java/java_arraylist.asp',
      },
      {
        id: 'prog_java_multithreading',
        title: 'Multithreading and Concurrency',
        gfgUrl: 'https://www.geeksforgeeks.org/multithreading-in-java/',
        w3Url: 'https://www.w3schools.com/java/java_threads.asp',
      },
    ],
  },
  {
    id: 'prog_cpp',
    language: 'C++',
    topics: [
      {
        id: 'prog_cpp_basics',
        title: 'C++ Syntax, Pointers, and Memory Management',
        gfgUrl: 'https://www.geeksforgeeks.org/c-plus-plus/',
        w3Url: 'https://www.w3schools.com/cpp/cpp_pointers.asp',
      },
      {
        id: 'prog_cpp_oop',
        title: 'C++ Classes, Constructors, and Destructors',
        gfgUrl: 'https://www.geeksforgeeks.org/c-classes-and-objects/',
        w3Url: 'https://www.w3schools.com/cpp/cpp_classes.asp',
      },
      {
        id: 'prog_cpp_stl',
        title: 'Standard Template Library (STL: Vector, Map, Set)',
        gfgUrl: 'https://www.geeksforgeeks.org/the-c-standard-template-library-stl/',
        w3Url: 'https://www.w3schools.com/cpp/cpp_vectors.asp',
      },
    ],
  },
  {
    id: 'prog_javascript',
    language: 'JavaScript',
    topics: [
      {
        id: 'prog_js_fundamentals',
        title: 'ES6+ Syntax, Scopes, and Closures',
        gfgUrl: 'https://www.geeksforgeeks.org/javascript/',
        w3Url: 'https://www.w3schools.com/js/js_es6.asp',
      },
      {
        id: 'prog_js_async',
        title: 'Async/Await, Promises, and Event Loop',
        gfgUrl: 'https://www.geeksforgeeks.org/async-await-in-javascript/',
        w3Url: 'https://www.w3schools.com/js/js_async.asp',
      },
      {
        id: 'prog_js_dom',
        title: 'DOM Manipulation and Events',
        gfgUrl: 'https://www.geeksforgeeks.org/dom-document-object-model/',
        w3Url: 'https://www.w3schools.com/js/js_htmldom.asp',
      },
    ],
  },
  {
    id: 'prog_sql',
    language: 'SQL',
    topics: [
      {
        id: 'prog_sql_queries',
        title: 'SELECT, Filtering, and Sorting',
        gfgUrl: 'https://www.geeksforgeeks.org/sql-tutorial/',
        w3Url: 'https://www.w3schools.com/sql/sql_select.asp',
      },
      {
        id: 'prog_sql_joins',
        title: 'INNER, LEFT, RIGHT, and FULL Joins',
        gfgUrl: 'https://www.geeksforgeeks.org/sql-join-set-1-inner-left-right-and-full-joins/',
        w3Url: 'https://www.w3schools.com/sql/sql_join.asp',
      },
      {
        id: 'prog_sql_aggregation',
        title: 'GROUP BY, HAVING, and Aggregation Functions',
        gfgUrl: 'https://www.geeksforgeeks.org/aggregate-functions-in-sql/',
        w3Url: 'https://www.w3schools.com/sql/sql_groupby.asp',
      },
    ],
  },
  {
    id: 'prog_html_css',
    language: 'HTML & CSS',
    topics: [
      {
        id: 'prog_html_semantic',
        title: 'Semantic HTML5 Elements & Forms',
        gfgUrl: 'https://www.geeksforgeeks.org/html-tutorial/',
        w3Url: 'https://www.w3schools.com/html/html5_semantic_elements.asp',
      },
      {
        id: 'prog_css_layout',
        title: 'Flexbox, CSS Grid, and Responsive Layouts',
        gfgUrl: 'https://www.geeksforgeeks.org/css-tutorial/',
        w3Url: 'https://www.w3schools.com/css/css3_flexbox.asp',
      },
    ],
  },
]
