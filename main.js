/**
 * Created by Benedikt on 22.03.2017.
 */
var timer;
var started = false;
var results = [];
var result_scale;
var result_axis;
var pad_top = 20, pad_left = 20, pad_right = 400, pad_bot = 20;
function Result() {
    this.count = 0;
}
function build() {
    results.push(new Result())
    $("button").button();
    $(".spinner").spinner();
    $("#possibilities").on("spinchange", function (event, ui) {
        adjust_results();
        updateGraph();
    });
    $("#i_per_s").on("spinchange", function () {
        startSpinner();
    });
    $("#start_timer").on("click", function () {
        started = true;
        startSpinner();
    });
    $("#stop_timer").on("click", function () {
        started = false;
        startSpinner();
    });
    $("#reset").on("click", function () {
        for(var i=0; i<results.length; i++){
            results[i].count=0;
        }
        started = false;
        startSpinner();
        updateGraph();
    });
}
$("body").ready(function () {
    build();
    adjust_results()
    updateGraph();
});
function next_experiment() {
    console.log("Experimenting...");
    results[Math.floor(Math.random() * results.length)].count++;
    updateGraph();
}
function adjust_results() {
    while (results.length > $("#possibilities").spinner("value")) {
        results.pop();
    }
    while (results.length < $("#possibilities").spinner("value")) {
        results.push(new Result());
    }
}
function updateGraph() {
    var svg = d3.select("#d3_graph_svg");
    svg.selectAll("*").remove();
    result_scale = d3.scaleLinear().domain([0, d3.max(results, function (d) {
        return d.count;
    })]).range([0, $("#d3_graph_svg").width() - pad_right - pad_left]);
    result_axis = d3.axisBottom().scale(result_scale).ticks(10);
    var bot = $("#d3_graph_svg").height() - pad_bot;
    var diff = (bot - pad_top) / results.length;
    var cnt = 0;
    var bar = svg.selectAll("g")
        .data(results)
        .enter().append("g")
        .attr("transform", function (d, i) {
            cnt += d.count;
            return "translate("+pad_left+"," + i * diff + ")";
        });
    bar.append("rect")
        .attr("width", function (d) {
            var r = result_scale(d.count);
            if (r == 0)
                r = 1;
            return r;
        })
        .attr("height", diff - 1)
        .on("mouseenter",function (d,i) {
            svg.selectAll(".tt").remove();
            var w=d3.select(this).attr("width");
            var h=d3.select(this).attr("height")/2;
            d3.select(this.parentNode).append("text")
                .text(" "+d.count)
                .attr("x", w)
                .attr("y",  h)
                .attr("class", "tooltip tt")
                .attr("dy", ".35em");
            d3.select(this.parentNode).append("text")
                .text(((d.count/cnt)*100).toFixed(2)+"%")
                .attr("x", w)
                .attr("y",  h)
                .attr("class", "tooltip2 tt")
                .attr("dy", ".35em");
        })

        .attr("class", "bar")
        .attr("id", function (d, i) {
            return "bar" + i;
        })
        .on("mouseout", function (d) {
            svg.selectAll(".tt").remove();
        });

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + pad_left + "," + bot + ")")
        .call(result_axis);
    svg.append("text")
        .attr("claas", "total")
        .text(function () {
            return cnt + " Experimente"
        })
        .attr("y", pad_top)
        .attr("x", $("#d3_graph_svg").width() - pad_right);

}
function moushandle(d,i,svg){
   //

}
function startSpinner() {
    if (timer) {
        clearInterval(timer);
    }
    if (started) {
        var timesetting = 1000.0 / $("#i_per_s").spinner("value");
        if (timesetting < 10) {

            timer = setInterval(function () {
                for (var i = 0; i < (10 / timesetting); i++) {
                    next_experiment();
                }
            }, 10);
        } else {

            timer = setInterval(next_experiment, timesetting);
        }
    }
}