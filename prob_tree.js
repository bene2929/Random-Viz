/**
 * Created by Benedikt on 28.03.2017.
 */
var total_results = 0;
var tree = new Prob_Node();
var boxHeight = 400;
var boxWidth = 1000;
var timer;
var tree_d3 = null;
function Prob_Node(parent) {
    this.result_text = null;
    this.results = 0;
    this.children = null;
    this.probability_n = 0;
    this.probability_z = 0;
    this.parent_i = parent;
    this.svg_element = null;
    this.addChild = function () {
        var nn = new Prob_Node(this);
        if (this.children == null) {
            this.children = [];
        }
        this.children.push(nn);
        buildNode(tree);
        nn.change_z(1);
        nn.change_n(this.children.length);
    };
    this.totalPerc = function () {
        if (tree.results != 0) {
            return (this.results / tree.results) * 100.0
        } else {
            return 50;
        }
    };
    this.updateResultText = function () {
        if (this.svg_element) {
            // this.svg_element.select(".plus").this.svg_element.select
        }
        if (this.result_text) {
            var text = "";
            var totalPerc = this.totalPerc();
            text = text.concat(this.results + ", " + totalPerc.toFixed(1) + "% of total");
            var totalParentResult = 0;
            if (this.parent_i) {
                this.parent_i.children.forEach(function (e) {
                    totalParentResult += e.results;
                });
                var nodePerc = (this.results / (totalParentResult == 0 ? 1 : totalParentResult)) * 100;

                text = text.concat(", " + nodePerc.toFixed(1) + "% of node");
            }

            this.result_text.text(text);
        }
    };
    this.removeChild = function () {
        if (this.children != null) {
            this.children.pop();
            if (this.children.length == 0) {
                this.children = null;
            }
        }
        buildNode(tree);
    };
    this.setAllChildsN = function (n, deep) {
        if (this.children != null) {
            var n_new = this.children.length;
            if (n) {
                n_new = n;
            }
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].probability_n = n_new;
                if (deep) {
                    this.children[i].setAllChildsN(n_new);
                }
            }
        }
    };
    this.change_n = function (cnt, text_element, error_display) {
        var new_n = cnt + this.probability_n;
        if (this.parent_i.children.length > new_n) {
            new_n = this.parent_i.children.length;
        }
        this.parent_i.setAllChildsN(new_n, false);

        if (text_element) {
            text_element.text(new_n);
        }
    };

    this.change_z = function (cnt, text_element, error_display) {
        var new_z = cnt + this.probability_z;
        if ((new_z > 0 && new_z <= this.parent_i.children.length)) {
            this.probability_z = new_z;
            if (text_element) {
                text_element.text(this.probability_z);
            }
            var sum = 0;
            for (var i = 0; i < this.parent_i.children.length; i++) {
                sum += this.parent_i.children[i].probability_z;
            }
            if (error_display) {
                if (sum > this.probability_n) {
                    error_display.text("Probality is more than 1!");
                }
                if (sum < this.probability_n) {
                    error_display.text("Probality doesn't add up to 1!");
                }
            }
            if (text_element) {
                text_element.text(new_z);
            }

        }
    };
    this.doExperiment = function () {
        this.results++;
        this.updateResultText();
        if (this.children != null) {
            var rand = Math.random();
            var sum = 0;
            for (var i = 0; i < this.children.length; i++) {
                sum += this.children[i].probability_z / this.children[i].probability_n;
                if (rand < sum) {
                    this.children[i].doExperiment();
                    return;
                }
            }
        }
    };
    this.setAllChildsN(false, true);
}

$("body").ready(function () {

    $("#i_per_s_tree").on("spinchange", function () {
        startSpinner_tree();
    });
    $("#start_timer_tree").on("click", function () {
        started = true;
        startSpinner_tree();
    });
    $("#stop_timer_tree").on("click", function () {
        started = false;
        startSpinner_tree();
    });
    $("#reset_tree").on("click", function () {
        tree = new Prob_Node();
        started = false;
        startSpinner_tree();
        buildNode(tree);
    });
    buildNode(tree);
});
function calculateRadius(d) {
    return 2 + d.data.totalPerc() / 4;
}
function buildNode(root) {
    var svg = d3.select("#tree");
    svg.select("#tree_g").remove();
    var graph = svg.append("g").attr("transform", "translate(" + scaleW(0) + "," + scaleH(0) + ")").attr("id", "tree_g");
    var treemap = d3.tree()
        .size([boxHeight - 40, boxWidth]);
    var nodes = d3.hierarchy(root, function (d) {
        return d.children;
    });
    nodes = treemap(nodes);
    var link = graph.selectAll(".link")
        .data(nodes.descendants().slice(1))
        .enter().append("g").append("path")
        .attr("class", "link")
        .style("stroke", "red")
        .attr("d", function (d) {
            return "M" + d.y + "," + d.x
                + "C" + (d.y + d.parent.y) / 2 + "," + d.x
                + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
                + " " + d.parent.y + "," + d.parent.x;
        });
    var node = graph.selectAll(".node")
        .data(nodes.descendants())
        .enter().append("g")
        .attr("class", function (d) {
            return "node" +
                (d.children == null ? " node--internal" : " node--leaf");
        })
        .attr("transform", function (d) {
            d.data.svg_element = d3.select(this);
            return "translate(" + d.y + "," + d.x + ")";
        });
    node.append("circle")
        .attr("r", calculateRadius)
        .attr("class","prob_circle");//function(d) { return d.data.level; });


    addButtonsToElement(node, function (e, val) {
        var pn = d3.select(e).data()[0].data;
        if (val == 1) {
            pn.addChild();
        } else if (val == -1) {
            pn.removeChild();
        }
    });
    link.each(function (d) {
        var link_n = d3.select(this);

        var pn = link_n.data()[0].data;

        var bbox = link_n.node().getBBox();
        addButtonsToElement(d3.select($(this).parent("g").get(0)).append("g").attr("transform", "translate(" + (bbox.x + bbox.width / 2) + "," + (bbox.y + bbox.height / 2) + ")"), function (e, val) {
            console.log(val);
        }, link_n);
    });
}

function addButtonsToElement(element, handler, useparent) {
    if (useparent) {
        var parent_g = d3.select($(useparent.node()).parent("g").get(0));
        var bbox = useparent.node().getBBox();
        var midX = bbox.x + bbox.width / 2;
        var midY = bbox.y + bbox.height / 2;
        parent_g.on("mouseenter", function () {
            parent_g.append("rect")
                .attr("x", bbox.x + scaleW(3))
                .attr("y", bbox.y)
                .attr("width", bbox.width - scaleW(6))
                .attr("height", bbox.height)
                .attr("opacity", "0").attr("visibility", "hidden").attr("pointer-events", "all")
                .attr("class", "add_text");
            var n_text, z_text;

            function addText(x, y, text, event, is_number, is_z) {
                return parent_g.append("text")
                    .attr("x", midX + scaleW(x))
                    .attr("y", midY + scaleH(y))
                    .attr("dy", "0.35em")
                    .attr("width", scaleW(2.5))
                    .attr("height", scaleH(5))
                    .text(function (d) {
                        if (is_number) {
                            var pn = d3.select(this).data()[0].data;
                            return is_z ? pn.probability_z : pn.probability_n;
                        } else {
                            return text;
                        }
                    })
                    .attr("class", "add_text")
                    .attr("text-anchor", "middle")
                    .attr("pointer-events", "visible")
                    .on("click", function () {

                        handler(this, 0);
                        if (event != null) {
                            var pn = d3.select(this).data()[0].data;
                            event(pn);

                        }
                    });
            }

            var h_p = 5;
            n_text = addText(0, h_p, "0", null, true, false);

            z_text = addText(0, -h_p, "0", null, true, true);

            var n_text_p = addText(2.5, h_p, "+", function (pn) {
                pn.change_n(1, n_text);
            });
            var n_text_n = addText(-2.5, h_p, "-", function (pn) {
                pn.change_n(-1, n_text);
            });
            var break_t = addText(0, 0, "-", null);
            var z_text_p = addText(2.5, -h_p, "+", function (pn) {
                pn.change_z(1, z_text);
            });
            var z_text_n = addText(-2.5, -h_p, "-", function (pn) {
                pn.change_z(-1, z_text);
            });
        }).on("mouseleave", function () {
            parent_g.selectAll(".add_text").remove();
        });

    } else {

        element.append("rect")
            .attr("x", useparent ? (useparent.node().getBBox().x + scaleW(3)) : scaleW(-5))
            .attr("y", useparent ? useparent.node().getBBox().y : scaleH(-5))
            .attr("width", useparent ? (useparent.node().getBBox().width - scaleW(6)) : scaleW(10))
            .attr("height", useparent ? useparent.node().getBBox().height : scaleH(10))
            .attr("opacity", "0").attr("visibility", "hidden").attr("pointer-events", "all");
        element.on("mouseenter", function () {
            var hovering = d3.select(this);
            var pn = hovering.data()[0].data;

            function addLayover(x, y, text, event, parent, class_add) {
                var classes = "add_text";
                if (class_add) {
                    classes += " " + class_add;
                }
                return parent.append("text")
                    .attr("x", scaleW(x))
                    .attr("y", scaleW(y)).attr("dy", "0.35em")
                    .text(text)
                    .attr("class", classes).attr("text-anchor", "middle").attr("pointer-events", "visible").on("click", function () {
                        if (event) {
                            event(this);
                        }
                    });
            };
            addLayover(-2.5, 0, "-", function (e) {
                handler(e, -1);
            }, hovering, "minus");

            addLayover(2.5, 0, "+", function (e) {
                handler(e, 1);
            }, hovering, "plus");
            var result_text = addLayover(0, 2.5, "", function (e) {

            }, hovering, "prob_display");
            pn.result_text = result_text;
            pn.updateResultText();

        }).on("mouseleave", function () {
            var hovering = d3.select(this);
            var pn = hovering.data()[0].data;
            hovering.selectAll(".add_text").remove();
            pn.result_text = null;
        });
    }

}

function scaleW(percent) {
    return boxWidth * percent / 100.0;
}

function scaleH(percent) {
    return boxHeight * percent / 100.0;
}
function startSpinner_tree() {

    if (timer) {
        clearInterval(timer);
    }
    if (started) {
        var timesetting = 1000.0 / $("#i_per_s_tree").spinner("value");
        if (timesetting < 10) {

            timer = setInterval(function () {
                for (var i = 0; i < (10 / timesetting); i++) {
                    next_experiment_tree();
                }
            }, 10);
        } else {

            timer = setInterval(next_experiment_tree, timesetting);
        }
    }
}
function next_experiment_tree() {
    tree.doExperiment();


    var t = d3.transition()
        .duration(500)
        .ease(d3.easeLinear);
    var node=d3.selectAll(".node");
    node.interrupt(t).selectAll("circle").transition(t).attr("r", calculateRadius);

    node.selectAll(".plus").attr("x", function (d) {
       return scaleW(2.5) + (calculateRadius(d))-15;
    });

    node.selectAll(".minus").attr("x", function (d) {
        return scaleW(-2.5) -( (calculateRadius(d))-15);
    });
    node.selectAll(".prob_display").attr("y", function (d) {
        return scaleH(2.5) +  (calculateRadius(d))+5;
    });

}